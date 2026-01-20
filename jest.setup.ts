import '@testing-library/jest-dom'

// Mock Electron IPC for renderer tests
Object.defineProperty(window, 'api', {
  value: {
    file: {
      read: jest.fn(),
      write: jest.fn(),
      list: jest.fn(),
      watchStart: jest.fn(),
      watchStop: jest.fn(),
      onWatchEvent: jest.fn(() => jest.fn()),
    },
    dir: {
      select: jest.fn(),
      create: jest.fn(),
    },
    claude: {
      send: jest.fn(),
      onStream: jest.fn(() => jest.fn()),
      cancel: jest.fn(),
      getStatus: jest.fn(),
    },
    git: {
      init: jest.fn(),
      commit: jest.fn(),
      status: jest.fn(),
      diff: jest.fn(),
    },
    project: {
      load: jest.fn(),
      save: jest.fn(),
    },
    template: {
      list: jest.fn(),
      get: jest.fn(),
      save: jest.fn(),
    },
  },
  writable: true,
})
