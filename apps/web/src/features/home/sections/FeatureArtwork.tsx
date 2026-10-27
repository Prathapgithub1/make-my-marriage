type FeatureArtworkKind = 'budget' | 'guests' | 'website';

const sampleGuests = [
  { initial: 'D', name: 'Dev Patel', status: 'Confirmed' },
  { initial: 'A', name: 'Ananya Rao', status: 'Confirmed' },
  { initial: 'K', name: 'Karan S. (+1)', status: 'Pending' },
];

export function FeatureArtwork({ kind }: { kind: FeatureArtworkKind }) {
  if (kind === 'budget') {
    return (
      <div className="feature-art budget-art" aria-label="Sample expense tracking preview">
        <div className="art-heading">
          <span>Allocated budget</span>
          <strong>
            ₹24,100 <small>/ ₹28,400</small>
          </strong>
        </div>
        <div className="budget-track">
          <span />
        </div>
        <div className="budget-line">
          <span>Floral Design</span>
          <strong>₹8,400</strong>
        </div>
        <div className="budget-line">
          <span>Venue deposit</span>
          <strong>₹12,000</strong>
        </div>
        <span className="paid-status">
          <i /> Deposit paid · Sample
        </span>
      </div>
    );
  }

  if (kind === 'guests') {
    return (
      <div className="feature-art guest-list-art" aria-label="Sample guest RSVP list preview">
        <div className="art-heading">
          <span>Guest responses</span>
          <strong>Sample list</strong>
        </div>
        <div className="guest-list-labels">
          <span>Name</span>
          <span>RSVP</span>
        </div>
        {sampleGuests.map((guest) => (
          <div className="guest-list-row" key={guest.name}>
            <i>{guest.initial}</i>
            <span>{guest.name}</span>
            <strong>{guest.status}</strong>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="feature-art website-card-art" aria-label="Sample wedding website preview">
      <div className="website-card-top">
        <span>Prathap &amp; Akshitha’s celebration</span>
        <i>•••</i>
      </div>
      <div className="website-card-body">
        <span>YOU ARE INVITED</span>
        <strong>
          Celebrate
          <br />
          together.
        </strong>
        <small>14 November 2025 · Udaipur</small>
        <b>
          View details <span aria-hidden="true">→</span>
        </b>
      </div>
    </div>
  );
}
