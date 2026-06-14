import * as Diff from 'diff';

export function computeTextDiff(oldText: string, newText: string): string {
  const changes = Diff.diffLines(oldText, newText);
  return JSON.stringify(changes);
}

export function formatDiffForDisplay(diffJson: string): Array<{ added?: boolean; removed?: boolean; value: string }> {
  try {
    return JSON.parse(diffJson);
  } catch {
    return [{ value: diffJson }];
  }
}
