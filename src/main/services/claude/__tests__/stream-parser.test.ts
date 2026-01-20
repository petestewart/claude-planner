import { StreamParser } from '../stream-parser'

describe('StreamParser', () => {
  let parser: StreamParser

  beforeEach(() => {
    parser = new StreamParser()
  })

  describe('parse', () => {
    it('parses text events from assistant_text type', () => {
      const events = parser.parse('{"type":"assistant_text","text":"Hello"}\n')
      expect(events).toEqual([{ type: 'text', content: 'Hello' }])
    })

    it('parses text events from assistant type', () => {
      const events = parser.parse('{"type":"assistant","text":"World"}\n')
      expect(events).toEqual([{ type: 'text', content: 'World' }])
    })

    it('parses thinking events', () => {
      const events = parser.parse('{"type":"thinking","text":"Let me think..."}\n')
      expect(events).toEqual([{ type: 'thinking', content: 'Let me think...' }])
    })

    it('handles partial lines and buffers correctly', () => {
      // Send partial line
      expect(parser.parse('{"type":"assis')).toEqual([])
      // Complete the line
      expect(parser.parse('tant_text","text":"Hi"}\n')).toEqual([
        { type: 'text', content: 'Hi' },
      ])
    })

    it('handles multiple lines in single chunk', () => {
      const events = parser.parse(
        '{"type":"assistant_text","text":"Hello"}\n{"type":"assistant_text","text":" World"}\n'
      )
      expect(events).toEqual([
        { type: 'text', content: 'Hello' },
        { type: 'text', content: ' World' },
      ])
    })

    it('ignores empty lines', () => {
      const events = parser.parse('\n\n{"type":"assistant_text","text":"Test"}\n\n')
      expect(events).toEqual([{ type: 'text', content: 'Test' }])
    })

    it('parses error events', () => {
      const events = parser.parse('{"type":"error","message":"Something went wrong"}\n')
      expect(events).toEqual([{ type: 'error', message: 'Something went wrong' }])
    })

    it('parses error events with code', () => {
      const events = parser.parse(
        '{"type":"error","message":"Rate limited","code":"RATE_LIMIT"}\n'
      )
      expect(events).toEqual([
        { type: 'error', message: 'Rate limited', code: 'RATE_LIMIT' },
      ])
    })

    it('ignores unknown event types', () => {
      const events = parser.parse('{"type":"unknown_type","data":"test"}\n')
      expect(events).toEqual([])
    })

    it('ignores malformed JSON gracefully', () => {
      const events = parser.parse('not valid json\n')
      expect(events).toEqual([])
    })
  })

  describe('file operations', () => {
    it('parses write_file tool use as file_start create', () => {
      const events = parser.parse(
        '{"type":"tool_use","tool":"write_file","input":{"path":"/test/file.txt"}}\n'
      )
      expect(events).toEqual([
        { type: 'file_start', path: '/test/file.txt', action: 'create' },
      ])
    })

    it('parses Write tool use as file_start create', () => {
      const events = parser.parse(
        '{"type":"tool_use","tool":"Write","input":{"file_path":"/test/file.txt"}}\n'
      )
      expect(events).toEqual([
        { type: 'file_start', path: '/test/file.txt', action: 'create' },
      ])
    })

    it('parses edit_file tool use as file_start modify', () => {
      const events = parser.parse(
        '{"type":"tool_use","tool":"edit_file","input":{"path":"/test/file.txt"}}\n'
      )
      expect(events).toEqual([
        { type: 'file_start', path: '/test/file.txt', action: 'modify' },
      ])
    })

    it('parses Edit tool use as file_start modify', () => {
      const events = parser.parse(
        '{"type":"tool_use","tool":"Edit","input":{"file_path":"/test/file.txt"}}\n'
      )
      expect(events).toEqual([
        { type: 'file_start', path: '/test/file.txt', action: 'modify' },
      ])
    })

    it('parses tool_result as file_end when file is open', () => {
      // Start a file operation
      parser.parse(
        '{"type":"tool_use","tool":"write_file","input":{"path":"/test/file.txt"}}\n'
      )
      // End the file operation
      const events = parser.parse('{"type":"tool_result","result":"success"}\n')
      expect(events).toEqual([{ type: 'file_end', path: '/test/file.txt' }])
    })

    it('returns null for tool_result when no file is open', () => {
      const events = parser.parse('{"type":"tool_result","result":"success"}\n')
      expect(events).toEqual([])
    })

    it('parses generic tool_use events', () => {
      const events = parser.parse(
        '{"type":"tool_use","tool":"read_file","input":{"path":"/test/file.txt"}}\n'
      )
      expect(events).toEqual([
        { type: 'tool_use', tool: 'read_file', input: { path: '/test/file.txt' } },
      ])
    })
  })

  describe('content_block_delta', () => {
    it('parses text_delta from content_block_delta', () => {
      const events = parser.parse(
        '{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n'
      )
      expect(events).toEqual([{ type: 'text', content: 'Hello' }])
    })

    it('ignores content_block_delta without text_delta', () => {
      const events = parser.parse(
        '{"type":"content_block_delta","delta":{"type":"other","data":"test"}}\n'
      )
      expect(events).toEqual([])
    })
  })

  describe('flush', () => {
    it('returns empty array when no content buffered', () => {
      const events = parser.flush()
      expect(events).toEqual([])
    })

    it('closes open file on flush', () => {
      // Start a file operation
      parser.parse(
        '{"type":"tool_use","tool":"write_file","input":{"path":"/test/file.txt"}}\n'
      )
      // Flush should close the file
      const events = parser.flush()
      expect(events).toEqual([{ type: 'file_end', path: '/test/file.txt' }])
    })
  })

  describe('reset', () => {
    it('clears buffer and file state', () => {
      // Add some state
      parser.parse('{"type":"assis')
      parser.parse(
        '{"type":"tool_use","tool":"write_file","input":{"path":"/test/file.txt"}}\n'
      )

      // Reset
      parser.reset()

      // Verify clean state by checking flush returns empty
      const events = parser.flush()
      expect(events).toEqual([])
    })
  })
})
