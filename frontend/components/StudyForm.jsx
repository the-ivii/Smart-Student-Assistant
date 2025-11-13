import { useState } from 'react'

export default function StudyForm({ onSubmit, loading }) {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('normal')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (topic.trim()) {
      onSubmit(topic.trim(), mode)
    }
  }

  return (
    <form className="study-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="topic" className="form-label">
          What do you want to learn today?
        </label>
        <input
          id="topic"
          type="text"
          className="form-input"
          placeholder="e.g., Generative AI, Regression, Probability ..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label className="mode-toggle">
          <input
            type="checkbox"
            checked={mode === 'math'}
            onChange={(e) => setMode(e.target.checked ? 'math' : 'normal')}
            disabled={loading}
          />
          <span className="mode-label">
            Math Mode 
          </span>
        </label>
      </div>

      <button 
        type="submit" 
        className="submit-button"
        disabled={loading || !topic.trim()}
      >
        {loading ? 'Generating...' : 'Let\'s Start Learning'}
      </button>
    </form>
  )
}

