export const ONBOARDING_KEY = "singularity.onboarding.v1";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "done";
}

export function completeOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_KEY, "done");
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_KEY);
}
