import { useState } from 'react'

export default function StudyResults({ data }) {
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showExplanations, setShowExplanations] = useState({})

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer
    })
  }

  const handleCheckAnswer = (questionIndex) => {
    setShowExplanations({
      ...showExplanations,
      [questionIndex]: true
    })
  }

  const isCorrect = (questionIndex, selectedAnswer) => {
    if (!data.quiz || !data.quiz[questionIndex]) return false
    return selectedAnswer === data.quiz[questionIndex].correctAnswer
  }

  return (
    <div className="results">
      {/* Study Materials header - only show in normal mode */}
      {data.mode !== 'math' && (
        <div className="results-header">
          <h2>Study Materials: {data.topic}</h2>
          <a 
            href={data.source} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="source-link"
          >
            View Source
          </a>
        </div>
      )}

      {/* Summary Section */}
      <section className="section summary-section">
        <h3>Summary</h3>
        <ul className="summary-list">
          {data.summary.map((point, index) => (
            <li key={index} className="summary-item">
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* Quiz or Math Question Section */}
      {data.mode === 'math' ? (
        <section className="section math-section">
          <h3>Math Challenge</h3>
          <div className="math-question">
            <p className="question-text">{data.mathQuestion.question}</p>
            <div className="math-answer">
              <strong>Answer:</strong> {data.mathQuestion.answer}
            </div>
            <div className="math-explanation">
              <strong>Explanation:</strong>
              <p>{data.mathQuestion.explanation}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="section quiz-section">
          <h3>Quiz Time</h3>
          {data.quiz.map((question, qIndex) => (
            <div key={qIndex} className="quiz-question">
              <p className="question-number">Question {qIndex + 1}</p>
              <p className="question-text">{question.question}</p>
              
              <div className="options">
                {question.options.map((option, oIndex) => {
                  const optionLetter = option.charAt(0)
                  const isSelected = selectedAnswers[qIndex] === optionLetter
                  const showResult = showExplanations[qIndex]
                  const isCorrectAnswer = optionLetter === question.correctAnswer
                  
                  let optionClass = 'option'
                  if (isSelected) optionClass += ' selected'
                  if (showResult && isCorrectAnswer) optionClass += ' correct'
                  if (showResult && isSelected && !isCorrectAnswer) optionClass += ' incorrect'

                  return (
                    <button
                      key={oIndex}
                      className={optionClass}
                      onClick={() => handleAnswerSelect(qIndex, optionLetter)}
                      disabled={showExplanations[qIndex]}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {selectedAnswers[qIndex] && !showExplanations[qIndex] && (
                <button
                  className="check-button"
                  onClick={() => handleCheckAnswer(qIndex)}
                >
                  Check Answer
                </button>
              )}

              {showExplanations[qIndex] && (
                <div className={`explanation ${isCorrect(qIndex, selectedAnswers[qIndex]) ? 'correct' : 'incorrect'}`}>
                  <strong>
                    {isCorrect(qIndex, selectedAnswers[qIndex]) ? 'Correct!' : 'Incorrect'}
                  </strong>
                  <p>{question.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Study Tip Section */}
      <section className="section tip-section">
        <h3>Study Tip</h3>
        <p className="study-tip">{data.studyTip}</p>
      </section>
    </div>
  )
}

