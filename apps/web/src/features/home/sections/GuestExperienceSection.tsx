function InvitationPreview() {
  return (
    <div
      className="invitation-phone"
      role="img"
      aria-label="Illustrative mobile wedding invitation and RSVP form"
    >
      <div className="phone-top">
        <span />
      </div>
      <div className="phone-status">
        <span>9:41</span>
        <span>●●● ▰</span>
      </div>
      <div className="invitation-card">
        <span className="invitation-label">YOU’RE INVITED TO CELEBRATE</span>
        <h3>Prathap &amp; Akshitha’s Wedding</h3>
        <p>Saturday, November 14, 2025</p>
        <div className="invitation-rule" />
        <strong className="rsvp-question">Will you be attending?</strong>
        <div className="rsvp-options">
          <span className="selected">✓ Attending</span>
          <span>Regretfully decline</span>
        </div>
        <div className="guest-count-row">
          <span>Number of guests</span>
          <strong>− &nbsp; 2 &nbsp; +</strong>
        </div>
        <span className="invitation-submit">Submit RSVP</span>
        <p className="invitation-note">
          Illustrative RSVP preview · Guests do not need an account.
        </p>
      </div>
      <div className="phone-home-indicator">
        <span />
      </div>
    </div>
  );
}

export function GuestExperienceSection() {
  return (
    <section className="guest-section" id="guest-experience" aria-labelledby="guest-title">
      <div className="page-container guest-content">
        <header className="section-heading">
          <p className="section-eyebrow">Guest Usability First</p>
          <h2 id="guest-title">Easy for your guests, too.</h2>
          <p>
            Make it simple for guests to find their invitation, review event details, and respond to
            an RSVP without creating an account.
          </p>
        </header>
        <InvitationPreview />
        <p className="guest-reassurance">No account creation or password required.</p>
      </div>
    </section>
  );
}
