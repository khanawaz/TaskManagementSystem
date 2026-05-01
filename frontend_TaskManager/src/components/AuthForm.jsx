function AuthForm({
  title,
  description,
  fields,
  submitLabel,
  isSubmitting,
  errorMessage,
  onChange,
  onSubmit,
}) {
  return (
    <section className="stack">
      <div className="placeholder-card form-card">
        <h1>{title}</h1>
        <p>{description}</p>

        <form className="field-group" onSubmit={onSubmit}>
          {fields.map((field) => (
            <div className="field" key={field.name}>
              <label htmlFor={field.id}>{field.label}</label>
              <input
                id={field.id}
                name={field.name}
                type={field.type}
                value={field.value}
                placeholder={field.placeholder}
                onChange={onChange}
                autoComplete={field.autoComplete}
                disabled={isSubmitting}
                required
              />
            </div>
          ))}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button className="button button--primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Please wait...' : submitLabel}
          </button>
        </form>
      </div>
    </section>
  )
}

export default AuthForm
