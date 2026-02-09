#!/usr/bin/env bun
import { Command } from 'commander';
import { exit } from 'process';
import * as semver from 'semver';

interface Release {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

class GitHubReleaseNotesClient {
  private owner: string;
  private repo: string;
  private apiBaseUrl = 'https://api.github.com';

  constructor(githubUrl: string) {
    const parsed = this.parseGitHubUrl(githubUrl);
    this.owner = parsed.owner;
    this.repo = parsed.repo;
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    // Support various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
      /^([^\/]+)\/([^\/]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[2]) {
        return { owner: match[1], repo: match[2] };
      }
    }

    throw new Error(`Invalid GitHub URL format: ${url}`);
  }

  async fetchReleases(): Promise<Release[]> {
    const url = `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/releases?per_page=100`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Repository not found: ${this.owner}/${this.repo}`);
        }
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      const releases = (await response.json()) as Release[];
      return releases.filter((release) => !release.draft);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch releases: ${error}`);
    }
  }

  private normalizeVersion(version: string): string {
    // Clean the version using semver, which handles 'v' prefixes and other formats
    const cleaned = semver.clean(version);
    return cleaned || version; // Return original if cleaning fails
  }

  private compareVersions(a: string, b: string): number {
    try {
      // Normalize versions first
      const normalizedA = this.normalizeVersion(a);
      const normalizedB = this.normalizeVersion(b);

      // Use semver.compare which handles all semver cases including pre-releases
      if (semver.valid(normalizedA) && semver.valid(normalizedB)) {
        return semver.compare(normalizedA, normalizedB);
      }

      // Fallback to string comparison if not valid semver
      console.warn(
        `Warning: Invalid semver format detected. Using string comparison for ${a} vs ${b}`
      );
      return normalizedA.localeCompare(normalizedB, undefined, {
        numeric: true,
      });
    } catch (error) {
      // Final fallback to string comparison
      console.warn(
        `Warning: Semver comparison failed for ${a} vs ${b}. Using string comparison.`
      );
      return a.localeCompare(b, undefined, { numeric: true });
    }
  }

  private validateVersions(startVersion: string, endVersion: string): void {
    const normalizedStart = this.normalizeVersion(startVersion);
    const normalizedEnd = this.normalizeVersion(endVersion);

    // Check if start version is greater than or equal to end version
    if (this.compareVersions(normalizedStart, normalizedEnd) >= 0) {
      throw new Error(
        `Invalid version range: start version (${startVersion}) must be less than end version (${endVersion})`
      );
    }

    // Warn about non-semver versions
    if (!semver.valid(normalizedStart)) {
      console.warn(
        `Warning: Start version "${startVersion}" is not valid semver format`
      );
    }
    if (!semver.valid(normalizedEnd)) {
      console.warn(
        `Warning: End version "${endVersion}" is not valid semver format`
      );
    }
  }

  async getReleaseNotesBetweenVersions(
    startVersion: string,
    endVersion: string
  ): Promise<string> {
    // Validate input versions
    this.validateVersions(startVersion, endVersion);

    const releases = await this.fetchReleases();

    // Find releases between versions (excluding start, including end)
    const relevantReleases = releases.filter((release) => {
      const version = release.tag_name;
      const isAfterStart = this.compareVersions(version, startVersion) > 0;
      const isBeforeOrEqualEnd = this.compareVersions(version, endVersion) <= 0;
      return isAfterStart && isBeforeOrEqualEnd;
    });

    if (relevantReleases.length === 0) {
      return `No releases found between ${startVersion} (exclusive) and ${endVersion} (inclusive).`;
    }

    // Sort releases by version (oldest first)
    relevantReleases.sort((a, b) =>
      this.compareVersions(a.tag_name, b.tag_name)
    );

    // Merge release notes
    let mergedNotes = `# Release Notes: ${startVersion} → ${endVersion}\n\n`;
    mergedNotes += `Generated release notes for ${this.owner}/${this.repo}\n`;
    mergedNotes += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;

    for (const release of relevantReleases) {
      mergedNotes += `## ${release.name || release.tag_name}\n`;
      mergedNotes += `**Released:** ${new Date(
        release.published_at
      ).toDateString()}\n`;
      if (release.prerelease) {
        mergedNotes += `**Pre-release**\n`;
      }
      mergedNotes += `\n${release.body || 'No release notes provided.'}\n\n`;
      mergedNotes += '---\n\n';
    }

    return mergedNotes;
  }
}

async function main() {
  const program = new Command();

  program
    .name('gh-release-notes')
    .description(
      'Generate merged release notes from GitHub releases between two versions'
    )
    .version('1.0.0')
    .argument(
      '<github-url>',
      'GitHub repository URL (e.g., https://github.com/owner/repo or owner/repo)'
    )
    .argument('<start-version>', 'Starting version (exclusive)')
    .argument('<end-version>', 'Ending version (inclusive)')
    .option('-o, --output <file>', 'Output file path (default: stdout)')
    .action(
      async (
        githubUrl: string,
        startVersion: string,
        endVersion: string,
        options: { output?: string }
      ) => {
        try {
          console.log(`Fetching release notes for ${githubUrl}...`);
          console.log(
            `Version range: ${startVersion} (exclusive) → ${endVersion} (inclusive)`
          );

          const client = new GitHubReleaseNotesClient(githubUrl);
          const releaseNotes = await client.getReleaseNotesBetweenVersions(
            startVersion,
            endVersion
          );

          if (options.output) {
            await Bun.write(options.output, releaseNotes);
            console.log(`Release notes saved to: ${options.output}`);
          } else {
            console.log('\n' + releaseNotes);
          }
        } catch (error) {
          console.error(
            'Error:',
            error instanceof Error ? error.message : error
          );
          exit(1);
        }
      }
    );

  program.parse();
}

// Only run main if this is the main module
if (import.meta.main) {
  main();
}
