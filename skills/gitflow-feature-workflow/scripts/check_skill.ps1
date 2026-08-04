param(
    [string]$SkillPath = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$resolvedSkillPath = (Resolve-Path -LiteralPath $SkillPath).Path
$skillFile = Join-Path $resolvedSkillPath 'SKILL.md'
$templateFile = Join-Path $resolvedSkillPath 'references\agents-md-template.md'
$failures = [System.Collections.Generic.List[string]]::new()

function Require-Path {
    param([string]$RelativePath)
    if (-not (Test-Path -LiteralPath (Join-Path $resolvedSkillPath $RelativePath))) {
        $failures.Add("Missing required file: $RelativePath")
    }
}

function Require-Match {
    param(
        [string]$Name,
        [string]$Content,
        [string]$Pattern
    )
    if ($Content -notmatch $Pattern) {
        $failures.Add($Name)
    }
}

function Forbid-Match {
    param(
        [string]$Name,
        [string]$Content,
        [string]$Pattern
    )
    if ($Content -match $Pattern) {
        $failures.Add($Name)
    }
}

foreach ($relativePath in @(
    'SKILL.md',
    'references\agents-md-template.md',
    'references\feature.md',
    'references\hotfix.md',
    'references\release.md',
    'agents\openai.yaml',
    'scripts\check_skill.ps1'
)) {
    Require-Path $relativePath
}

if (-not (Test-Path -LiteralPath $skillFile) -or -not (Test-Path -LiteralPath $templateFile)) {
    Write-Error ("Skill validation failed:`n- " + ($failures -join "`n- "))
}

$skillContent = Get-Content -LiteralPath $skillFile -Raw
$templateContent = Get-Content -LiteralPath $templateFile -Raw
$markdownFiles = Get-ChildItem -LiteralPath $resolvedSkillPath -Recurse -File -Filter '*.md'
$allMarkdown = ($markdownFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join "`n"

Require-Match 'Missing YAML frontmatter name' $skillContent '(?m)^name:\s*gitflow-feature-workflow$'
Require-Match 'Description must start with Use when' $skillContent '(?m)^description:\s*Use when'

$descriptionMatch = [regex]::Match($skillContent, '(?m)^description:\s*(.+)$')
if ($descriptionMatch.Success -and $descriptionMatch.Groups[1].Value.Length -gt 500) {
    $failures.Add('Description exceeds 500 characters')
}

$wordCount = ([regex]::Matches($skillContent, '\S+')).Count
if ($wordCount -ge 1500) {
    $failures.Add("SKILL.md must remain below 1500 words; found $wordCount")
}

$retiredPattern = ('CLAUDE' + '\.md|DETAILED_DESCRIPTION' + '\.md|claude-md' + '-template')
Forbid-Match 'Retired project-context terminology remains' $allMarkdown $retiredPattern
Require-Match 'Feature playbook link is missing' $skillContent 'references/feature\.md'
Require-Match 'Hotfix playbook link is missing' $skillContent 'references/hotfix\.md'
Require-Match 'Release playbook link is missing' $skillContent 'references/release\.md'
Require-Match 'Conditional approval guidance is missing' $skillContent 'Ask only when'
Forbid-Match 'Unconditional plan approval pause remains' $skillContent 'Wait for the user to approve the plan'
Forbid-Match 'Exhaustive file inventory rule remains' $templateContent 'Every source, config, test, and doc file appears'
Require-Match 'Scalable file-reference guidance is missing' $templateContent 'key files.*key directories.*task-touched files'

Require-Match 'AGENTS.md context loading is missing' $allMarkdown 'AGENTS\.md'
Require-Match 'master production role is missing' $allMarkdown '(?s)`master`.*Production'
Require-Match 'develop integration role is missing' $allMarkdown '(?s)`develop`.*Integration'
Require-Match 'feature branch mapping is missing' $allMarkdown '(?s)`feature/<short-name>`.*`develop`.*`develop`'
Require-Match 'hotfix branch mapping is missing' $allMarkdown '(?s)`hotfix/<version>`.*`master`.*`master`.*`develop`'
Require-Match 'release branch mapping is missing' $allMarkdown '(?s)`release/<version>`.*`develop`.*`master`.*`develop`'
Require-Match 'Direct-commit guardrail is missing' $allMarkdown 'Never commit directly to `master` or `develop`'
Require-Match 'Branch-before-change guardrail is missing' $allMarkdown 'Branch before touching any file'
Require-Match 'Base-update requirement is missing' $allMarkdown '(?s)Before creating any branch.*pull the latest base branch'
Require-Match 'No-ff merge requirement is missing' $allMarkdown '(?s)merges into `develop` and `master` use `--no-ff`'
Require-Match 'Annotated master tags are missing' $allMarkdown 'annotated semver tag'
Require-Match 'Semver feature/minor rule is missing' $allMarkdown 'Feature.*minor'
Require-Match 'Semver bugfix/patch rule is missing' $allMarkdown 'Hotfix / bug fix.*patch'
Require-Match 'Semver breaking/major rule is missing' $allMarkdown 'Breaking change.*major'
Require-Match 'Conventional Commits rule is missing' $allMarkdown 'Conventional Commits'
Require-Match 'Co-author prohibition is missing' $allMarkdown 'Do not add a co-authorship trailer'
Require-Match 'Feature test rule is missing' $allMarkdown 'Every feature gets tests'
Require-Match 'Regression test rule is missing' $allMarkdown 'bug fix gets a regression test'
Require-Match 'Full-suite rule is missing' $allMarkdown 'full test suite'
Require-Match 'Lint/format rule is missing' $allMarkdown 'lint/format checks'
Require-Match 'No-remote local completion is missing' $allMarkdown '(?s)No remote configured.*complete the workflow locally'
Require-Match 'Local merge default is missing' $allMarkdown 'local merge mode by default|Local merge mode \(default\)'
Require-Match 'Protected-branch PR fallback is missing' $allMarkdown '(?s)Protected target branch.*pull request mode'
Require-Match 'Red-CI merge prohibition is missing' $allMarkdown '(?s)CI configured.*Never merge.*pipeline is red'
Require-Match 'Force-push guardrail is missing' $allMarkdown 'Never force-push'
Require-Match 'Rebase guardrail is missing' $allMarkdown 'Never rebase'
Require-Match 'Destructive confirmation is missing' $allMarkdown '(?s)Destructive operations(?: require confirmation|: confirm with the user)'
Require-Match 'Dirty-worktree protection is missing' $allMarkdown '(?s)Uncommitted changes.*ask whether to stash, commit, or abort'
Require-Match 'Conflict-resolution guardrail is missing' $allMarkdown '(?s)merge conflict.*resolve it deliberately|Resolve conflicts deliberately'

if ($failures.Count -gt 0) {
    Write-Error ("Skill validation failed:`n- " + ($failures -join "`n- "))
}

Write-Output "PASS: structure, discovery metadata, scalable context, and Gitflow behavior validated."
Write-Output "PASS: SKILL.md contains $wordCount words across $($markdownFiles.Count) Markdown files."
