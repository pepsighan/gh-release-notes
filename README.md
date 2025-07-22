# GitHub Release Notes CLI

A command-line tool to generate merged release notes from GitHub releases between two versions. Built with Bun and TypeScript, featuring proper semantic versioning support.

## Features

- 🚀 **Semver Compatible**: Proper semantic version comparison with support for pre-releases (alpha, beta, rc)
- 📝 **Merged Release Notes**: Combines all release notes between versions into a single document
- 🎯 **Flexible Input**: Supports various GitHub URL formats and version formats
- 📄 **Multiple Output Options**: Display in terminal or save to file
- ⚡ **Fast**: Built with Bun for optimal performance
- 🛡️ **Robust**: Comprehensive error handling and validation

## Installation

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Local Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd gh-release-notes

# Install dependencies
bun install

# Run directly
bun run index.ts <github-url> <start-version> <end-version>
```

## Usage

### Basic Syntax

```bash
bun run index.ts <github-url> <start-version> <end-version> [options]
```

### Arguments

- **`github-url`**: GitHub repository URL or shorthand format
  - Full URL: `https://github.com/facebook/react`
  - Shorthand: `facebook/react`
- **`start-version`**: Starting version (exclusive - not included in output)
- **`end-version`**: Ending version (inclusive - included in output)

### Options

- **`-o, --output <file>`**: Save output to file instead of displaying in terminal
- **`-h, --help`**: Show help information
- **`-V, --version`**: Show version number

## Examples

### Basic Usage

```bash
# Get release notes between v18.0.0 and v18.2.0
bun run index.ts facebook/react v18.0.0 v18.2.0
```

### Using Full GitHub URLs

```bash
# Same result with full URL
bun run index.ts https://github.com/facebook/react v18.0.0 v18.2.0
```

### Pre-release Versions

```bash
# Works with alpha, beta, rc versions
bun run index.ts facebook/react v18.0.0-alpha.0 v18.0.0
```

### Save to File

```bash
# Save output to a markdown file
bun run index.ts facebook/react v18.0.0 v18.2.0 -o release-notes.md
```

### Complex Version Ranges

```bash
# Release candidates to stable
bun run index.ts facebook/react v17.0.0 v18.0.0-rc.0

# Different major versions
bun run index.ts facebook/react v16.14.0 v17.0.0
```

## Output Format

The tool generates a markdown document with:

- **Header**: Version range and repository information
- **Metadata**: Generation date
- **Release Sections**: Each release with:
  - Version number and release name
  - Release date
  - Pre-release indicator (if applicable)
  - Full release notes content
  - Separator between releases

### Sample Output

```markdown
# Release Notes: v18.0.0 → v18.2.0

Generated release notes for facebook/react
Date: 2025-07-22

## 18.1.0 (April 26, 2022)

**Released:** Wed Apr 27 2022

### React DOM

- Fix the false positive warning about `react-dom/client`...
- Fix `suppressHydrationWarning` to work in production too...

---

## 18.2.0 (June 14, 2022)

**Released:** Wed Jun 15 2022

### React DOM

- Provide a component stack as a second argument...
- Fix hydrating into `document` causing a blank page...

---
```

## Version Comparison

This tool uses proper semantic versioning (semver) rules:

- **Basic versions**: `1.0.0` < `1.0.1` < `1.1.0` < `2.0.0`
- **Pre-releases**: `1.0.0-alpha.1` < `1.0.0-alpha.2` < `1.0.0-beta.1` < `1.0.0-rc.1` < `1.0.0`
- **Version prefixes**: Handles `v1.0.0` and `1.0.0` formats
- **Fallback**: Uses string comparison for non-semver versions with warnings

## Error Handling

The tool provides helpful error messages for common issues:

- **Invalid version range**: When start version ≥ end version
- **Repository not found**: When GitHub repo doesn't exist
- **API errors**: When GitHub API is unavailable
- **Invalid semver**: Warnings for non-standard version formats

## Limitations

- **Public repositories only**: Uses GitHub's public API (no authentication required)
- **Rate limiting**: Subject to GitHub API rate limits (60 requests/hour for unauthenticated)
- **Draft releases**: Excludes draft releases from results
- **Large repositories**: May be slow for repos with many releases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run index.ts --help

# Run tests (if available)
bun test
```

## License

MIT 2025

## Support

For issues, feature requests, or questions:

- Open an issue on GitHub
- Check existing issues for solutions
- Provide version numbers and example commands when reporting bugs
