const Notification = ({ errorMessage, notifMessage }) => {
  if (!errorMessage  && !notifMessage) {
    return null
  }
  if (errorMessage) {
    return (
      <div style={{ color: 'red' }}>
        {errorMessage}
      </div>
    )
  }
  if (notifMessage) {
    return (
      <div style={{ color: 'green' }}>{notifMessage}</div>
    )
  }
}

export default Notification