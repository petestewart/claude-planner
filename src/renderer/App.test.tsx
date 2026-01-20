import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the title', () => {
    render(<App />)
    expect(screen.getByText('Spec Planner')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<App />)
    expect(
      screen.getByText('Create software specifications and implementation plans')
    ).toBeInTheDocument()
  })

  it('increments counter when button is clicked', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /increment/i })

    expect(screen.getByText('0')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByText('1')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
