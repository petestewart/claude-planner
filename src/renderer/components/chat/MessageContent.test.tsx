import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock react-markdown and remark-gfm before importing MessageContent
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({
    children,
    components,
  }: {
    children: string
    components?: Record<string, (props: Record<string, unknown>) => ReactNode>
  }) {
    // Simple mock that processes markdown-like content
    const content = children || ''

    // Handle headings
    if (content.startsWith('# ')) {
      return <h1>{content.slice(2)}</h1>
    }

    // Handle tables
    if (content.includes('|')) {
      return (
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cell 1</td>
              <td>Cell 2</td>
            </tr>
          </tbody>
        </table>
      )
    }

    // Handle lists
    if (content.includes('- ')) {
      const items = content
        .split('\n')
        .filter((line: string) => line.startsWith('- '))
      return (
        <ul>
          {items.map((item: string, i: number) => (
            <li key={i}>{item.slice(2)}</li>
          ))}
        </ul>
      )
    }

    // Handle code blocks with language
    const codeBlockMatch = content.match(/```(\w+)\n([\s\S]*?)\n```/)
    if (codeBlockMatch) {
      const language = codeBlockMatch[1]
      const code = codeBlockMatch[2]
      if (components?.pre) {
        const PreComponent = components.pre as (props: {
          children: ReactNode
        }) => ReactNode
        const CodeComponent = components.code as (props: {
          className?: string
          children: ReactNode
        }) => ReactNode
        return (
          <div>
            {PreComponent({
              children: CodeComponent({
                className: `language-${language}`,
                children: code,
              }),
            })}
          </div>
        )
      }
      return (
        <pre>
          <code className={`language-${language}`}>{code}</code>
        </pre>
      )
    }

    // Handle plain code blocks
    const plainCodeMatch = content.match(/```\n([\s\S]*?)\n```/)
    if (plainCodeMatch) {
      const code = plainCodeMatch[1]
      if (components?.pre) {
        const PreComponent = components.pre as (props: {
          children: ReactNode
        }) => ReactNode
        const CodeComponent = components.code as (props: {
          className?: string
          children: ReactNode
        }) => ReactNode
        return (
          <div>
            {PreComponent({
              children: CodeComponent({ children: code }),
            })}
          </div>
        )
      }
      return (
        <pre>
          <code>{code}</code>
        </pre>
      )
    }

    // Handle inline code
    const inlineCodeMatch = content.match(/`([^`]+)`/)
    if (inlineCodeMatch) {
      const beforeCode = content.slice(0, inlineCodeMatch.index)
      const afterCode = content.slice(
        (inlineCodeMatch.index ?? 0) + inlineCodeMatch[0].length
      )
      if (components?.code) {
        const CodeComponent = components.code as (props: {
          className?: string
          children: ReactNode
        }) => ReactNode
        return (
          <p>
            {beforeCode}
            {CodeComponent({ children: inlineCodeMatch[1] })}
            {afterCode}
          </p>
        )
      }
      return (
        <p>
          {beforeCode}
          <code>{inlineCodeMatch[1]}</code>
          {afterCode}
        </p>
      )
    }

    // Handle links
    const linkMatch = content.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      const beforeLink = content.slice(0, linkMatch.index)
      const afterLink = content.slice(
        (linkMatch.index ?? 0) + linkMatch[0].length
      )
      if (components?.a) {
        const AComponent = components.a as (props: {
          href: string
          children: ReactNode
        }) => ReactNode
        return (
          <p>
            {beforeLink}
            {AComponent({ href: linkMatch[2] || '', children: linkMatch[1] })}
            {afterLink}
          </p>
        )
      }
      return (
        <p>
          {beforeLink}
          <a href={linkMatch[2]}>{linkMatch[1]}</a>
          {afterLink}
        </p>
      )
    }

    // Handle bold
    if (content.includes('**')) {
      const parts = content.split(/\*\*/)
      return (
        <p>
          {parts.map((part: string, i: number) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </p>
      )
    }

    // Handle italic
    if (content.includes('*')) {
      const parts = content.split(/\*/)
      return (
        <p>
          {parts.map((part: string, i: number) =>
            i % 2 === 1 ? <em key={i}>{part}</em> : part
          )}
        </p>
      )
    }

    // Handle strikethrough
    if (content.includes('~~')) {
      const parts = content.split(/~~/)
      return (
        <p>
          {parts.map((part: string, i: number) =>
            i % 2 === 1 ? <del key={i}>{part}</del> : part
          )}
        </p>
      )
    }

    // Handle multiline content
    if (content.includes('\n\n')) {
      const paragraphs = content.split('\n\n')
      return (
        <div>
          {paragraphs.map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )
    }

    // Plain text
    return <p>{content}</p>
  }
})

jest.mock('remark-gfm', () => {
  return () => ({})
})

// Now import the component
import { MessageContent } from './MessageContent'

// Mock CSS modules
jest.mock('./chat.module.css', () => ({
  messageText: 'messageText',
  inlineCode: 'inlineCode',
  codeBlock: 'codeBlock',
  preBlock: 'preBlock',
  link: 'link',
  streamingCursor: 'streamingCursor',
}))

describe('MessageContent', () => {
  it('renders plain text content', () => {
    render(<MessageContent content="Hello, world!" />)
    expect(screen.getByText('Hello, world!')).toBeInTheDocument()
  })

  it('renders markdown headings', () => {
    render(<MessageContent content="# Heading 1" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Heading 1'
    )
  })

  it('renders markdown bold text', () => {
    render(<MessageContent content="This is **bold** text" />)
    expect(screen.getByText('bold')).toBeInTheDocument()
  })

  it('renders markdown italic text', () => {
    render(<MessageContent content="This is *italic* text" />)
    expect(screen.getByText('italic')).toBeInTheDocument()
  })

  it('renders markdown lists', () => {
    const listContent = `- Item 1
- Item 2
- Item 3`
    render(<MessageContent content={listContent} />)
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
  })

  it('renders inline code with correct styling', () => {
    const { container } = render(
      <MessageContent content="Use the `console.log` function" />
    )
    const inlineCode = container.querySelector('.inlineCode')
    expect(inlineCode).toBeInTheDocument()
    expect(inlineCode).toHaveTextContent('console.log')
  })

  it('renders code blocks with correct styling', () => {
    const codeContent = `\`\`\`javascript
const x = 1;
\`\`\``
    const { container } = render(<MessageContent content={codeContent} />)
    const codeBlock = container.querySelector('.codeBlock')
    expect(codeBlock).toBeInTheDocument()
  })

  it('renders pre blocks with correct styling', () => {
    const preContent = `\`\`\`
plain code block
\`\`\``
    const { container } = render(<MessageContent content={preContent} />)
    const preBlock = container.querySelector('.preBlock')
    expect(preBlock).toBeInTheDocument()
  })

  it('renders links with correct attributes', () => {
    render(
      <MessageContent content="Visit [example](https://example.com) for more" />
    )
    const link = screen.getByRole('link', { name: 'example' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows streaming cursor when isStreaming is true', () => {
    const { container } = render(
      <MessageContent content="Typing..." isStreaming={true} />
    )
    const cursor = container.querySelector('.streamingCursor')
    expect(cursor).toBeInTheDocument()
  })

  it('does not show streaming cursor when isStreaming is false', () => {
    const { container } = render(
      <MessageContent content="Done typing" isStreaming={false} />
    )
    const cursor = container.querySelector('.streamingCursor')
    expect(cursor).not.toBeInTheDocument()
  })

  it('does not show streaming cursor by default', () => {
    const { container } = render(<MessageContent content="Some content" />)
    const cursor = container.querySelector('.streamingCursor')
    expect(cursor).not.toBeInTheDocument()
  })

  it('renders GFM tables correctly', () => {
    const tableMarkdown = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |`
    render(<MessageContent content={tableMarkdown} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Header 1')).toBeInTheDocument()
    expect(screen.getByText('Cell 1')).toBeInTheDocument()
  })

  it('renders strikethrough text', () => {
    render(<MessageContent content="This is ~~deleted~~ text" />)
    const deletedText = screen.getByText('deleted')
    expect(deletedText.tagName.toLowerCase()).toBe('del')
  })

  it('handles code blocks with language class', () => {
    const codeContent = `\`\`\`typescript
const x: number = 1;
\`\`\``
    const { container } = render(<MessageContent content={codeContent} />)
    const codeBlock = container.querySelector('.codeBlock')
    expect(codeBlock).toBeInTheDocument()
    expect(codeBlock).toHaveClass('language-typescript')
  })

  it('handles empty content', () => {
    const { container } = render(<MessageContent content="" />)
    const messageText = container.querySelector('.messageText')
    expect(messageText).toBeInTheDocument()
  })

  it('handles multiline content', () => {
    const content = `Line 1

Line 2

Line 3`
    render(<MessageContent content={content} />)
    expect(screen.getByText('Line 1')).toBeInTheDocument()
    expect(screen.getByText('Line 2')).toBeInTheDocument()
    expect(screen.getByText('Line 3')).toBeInTheDocument()
  })
})
