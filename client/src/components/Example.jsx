import { useState } from 'react'

const Example = () => {
  const [message, setMessage] = useState('Hello from Example Component!')

  return (
    <div className="example-component">
      <h2>{message}</h2>
      <button onClick={() => setMessage('Message changed!')}>
        Change Message
      </button>
    </div>
  )
}

export default Example

