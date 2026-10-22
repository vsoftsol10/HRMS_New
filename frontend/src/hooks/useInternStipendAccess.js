import { useEffect, useState } from "react";

import internPortalServices from "../services/internPortalServices";

// Whether the logged-in intern should see the Stipend module. Interns on a
// free (Rs.0 stipend) internship must not; it switches on once HR converts
// them to a paid internship. Stays false until the server answers, and also
// when the call fails, so a free intern never sees a flash of the menu item.
export default function useInternStipendAccess(isIntern) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isIntern) return undefined;

    let cancelled = false;

    internPortalServices
      .getStipendAccess()
      .then((data) => {
        if (!cancelled) setEnabled(Boolean(data?.stipend_enabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isIntern]);

  return enabled;
}