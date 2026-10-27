const faqs = [
  {
    question: 'What is Make My Marriage?',
    answer:
      'A shared workspace for organizing wedding events, tasks, guests, invitations, RSVP responses, expenses, vendors, and a wedding website.',
  },
  {
    question: 'What can I organize with the platform?',
    answer:
      'Plan wedding events, assign tasks to wedding members, manage guests and invitations, collect RSVPs, track expenses, keep vendor details, and configure a wedding website, photo gallery, and YouTube livestream.',
  },
  {
    question: 'Can I share wedding details with my guests?',
    answer:
      'Yes. You can publish a themed wedding website with general wedding information and event details. Guest invitations remain separate and use unique links.',
  },
  {
    question: 'How do guest invitations and RSVPs work?',
    answer:
      'Wedding members can send invitations by email or share a unique invitation link. Guests use that link to view the events they are invited to and respond without signing in.',
  },
  {
    question: 'Do guests need to create an account?',
    answer:
      'No. Guests do not have application accounts. They access their invitation and RSVP through their unique link.',
  },
  {
    question: 'How can I get started?',
    answer:
      'Create an account, then add the wedding details to set up your shared planning workspace.',
  },
];

export function FaqSection() {
  return (
    <section className="faq-section" id="faqs" aria-labelledby="faq-title">
      <div className="page-container faq-content">
        <header className="section-heading">
          <p className="section-eyebrow">Clarity &amp; Confidence</p>
          <h2 id="faq-title">Questions, answered.</h2>
          <p>Straightforward answers about wedding planning and guest coordination.</p>
        </header>
        <div className="faq-list">
          {faqs.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>
                {item.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
