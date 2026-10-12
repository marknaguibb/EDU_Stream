import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    price: "Free Trial",
    description: "Try the platform with limited access.",
    features: ["Preview lessons", "View sample schedule", "Demo student access"],
    button: "Start Trial",
  },
  {
    name: "Student",
    price: "$19 / month",
    description: "Full student access to course content.",
    features: ["Recorded lectures", "Assignments", "Grades", "Live schedule"],
    button: "Choose Student Plan",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "$39 / month",
    description: "Advanced access with extra support.",
    features: ["Everything in Student", "Priority support", "Extra materials", "Progress tracking"],
    button: "Choose Premium",
  },
];

function SubscriptionPage() {
  return (
    <main className="subscription-page">
      <section className="subscription-hero">
        <div className="container text-center">
          <h1>Choose Your Subscription</h1>
          <p>
            Get access to recorded lectures, assignments, grades, schedules, and course materials.
          </p>
        </div>
      </section>

      <section className="container subscription-plans">
        <div className="row g-4 justify-content-center">
          {plans.map((plan) => (
            <div className="col-lg-4 col-md-6" key={plan.name}>
              <div className={`plan-card ${plan.highlighted ? "plan-card-highlighted" : ""}`}>
                {plan.highlighted && <span className="popular-badge">Most Popular</span>}

                <h3>{plan.name}</h3>
                <div className="plan-price">{plan.price}</div>
                <p className="plan-description">{plan.description}</p>

                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <i className="bi bi-check-circle-fill"></i>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to="/" className="btn btn-plan">
                  {plan.button}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <Link to="/" className="back-login-link">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default SubscriptionPage;