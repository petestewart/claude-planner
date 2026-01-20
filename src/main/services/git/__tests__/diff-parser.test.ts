/**
 * DiffParser tests
 */

import { DiffParser } from '../diff-parser'

describe('DiffParser', () => {
  let parser: DiffParser

  beforeEach(() => {
    parser = new DiffParser()
  })

  describe('parse', () => {
    it('should return empty array for empty input', () => {
      expect(parser.parse('')).toEqual([])
      expect(parser.parse('   ')).toEqual([])
    })

    it('should parse a simple modified file diff', () => {
      const diff = `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt
@@ -1,3 +1,4 @@
 line 1
+added line
 line 2
 line 3`

      const result = parser.parse(diff)

      expect(result).toHaveLength(1)
      const fileDiff = result[0]!
      expect(fileDiff.path).toBe('test.txt')
      expect(fileDiff.type).toBe('modified')
      expect(fileDiff.hunks).toHaveLength(1)

      const hunk = fileDiff.hunks[0]!
      expect(hunk.oldStart).toBe(1)
      expect(hunk.oldLines).toBe(3)
      expect(hunk.newStart).toBe(1)
      expect(hunk.newLines).toBe(4)

      // Check lines
      expect(hunk.lines).toHaveLength(4)
      expect(hunk.lines[0]).toEqual({
        type: 'context',
        content: 'line 1',
        oldLineNumber: 1,
        newLineNumber: 1,
      })
      expect(hunk.lines[1]).toEqual({
        type: 'add',
        content: 'added line',
        newLineNumber: 2,
      })
    })

    it('should parse a new file diff', () => {
      const diff = `diff --git a/new.txt b/new.txt
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/new.txt
@@ -0,0 +1,2 @@
+line 1
+line 2`

      const result = parser.parse(diff)

      expect(result).toHaveLength(1)
      expect(result[0]!.path).toBe('new.txt')
      expect(result[0]!.type).toBe('added')
    })

    it('should parse a deleted file diff', () => {
      const diff = `diff --git a/deleted.txt b/deleted.txt
deleted file mode 100644
index 1234567..0000000
--- a/deleted.txt
+++ /dev/null
@@ -1,2 +0,0 @@
-line 1
-line 2`

      const result = parser.parse(diff)

      expect(result).toHaveLength(1)
      expect(result[0]!.path).toBe('deleted.txt')
      expect(result[0]!.type).toBe('deleted')
    })

    it('should parse a renamed file diff', () => {
      const diff = `diff --git a/old-name.txt b/new-name.txt
similarity index 100%
rename from old-name.txt
rename to new-name.txt`

      const result = parser.parse(diff)

      expect(result).toHaveLength(1)
      expect(result[0]!.path).toBe('new-name.txt')
      expect(result[0]!.oldPath).toBe('old-name.txt')
      expect(result[0]!.type).toBe('renamed')
    })

    it('should parse multiple file diffs', () => {
      const diff = `diff --git a/file1.txt b/file1.txt
index 1234567..abcdefg 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1 +1 @@
-old content
+new content
diff --git a/file2.txt b/file2.txt
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/file2.txt
@@ -0,0 +1 @@
+new file content`

      const result = parser.parse(diff)

      expect(result).toHaveLength(2)
      expect(result[0]!.path).toBe('file1.txt')
      expect(result[0]!.type).toBe('modified')
      expect(result[1]!.path).toBe('file2.txt')
      expect(result[1]!.type).toBe('added')
    })

    it('should parse diff with multiple hunks', () => {
      const diff = `diff --git a/multi.txt b/multi.txt
index 1234567..abcdefg 100644
--- a/multi.txt
+++ b/multi.txt
@@ -1,3 +1,4 @@
 line 1
+added line A
 line 2
 line 3
@@ -10,3 +11,4 @@
 line 10
+added line B
 line 11
 line 12`

      const result = parser.parse(diff)

      expect(result).toHaveLength(1)
      expect(result[0]!.hunks).toHaveLength(2)

      expect(result[0]!.hunks[0]!.oldStart).toBe(1)
      expect(result[0]!.hunks[0]!.newStart).toBe(1)

      expect(result[0]!.hunks[1]!.oldStart).toBe(10)
      expect(result[0]!.hunks[1]!.newStart).toBe(11)
    })

    it('should handle diff with deletion lines', () => {
      const diff = `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt
@@ -1,4 +1,3 @@
 line 1
-deleted line
 line 2
 line 3`

      const result = parser.parse(diff)
      const hunk = result[0]!.hunks[0]!

      expect(hunk.lines).toHaveLength(4)
      expect(hunk.lines[1]).toEqual({
        type: 'delete',
        content: 'deleted line',
        oldLineNumber: 2,
      })
    })

    it('should preserve raw diff text', () => {
      const diff = `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt
@@ -1 +1 @@
-old
+new`

      const result = parser.parse(diff)

      expect(result[0]!.raw).toContain('diff --git')
      expect(result[0]!.raw).toContain('-old')
      expect(result[0]!.raw).toContain('+new')
    })

    it('should handle hunk headers without line counts', () => {
      const diff = `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt
@@ -1 +1 @@
-old
+new`

      const result = parser.parse(diff)
      const hunk = result[0]!.hunks[0]!

      // When count is omitted, it defaults to 1
      expect(hunk.oldLines).toBe(1)
      expect(hunk.newLines).toBe(1)
    })
  })
})
