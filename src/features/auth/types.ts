export interface SignInActionState {
  status: "idle" | "error"
  message?: string
  fieldErrors?: Partial<Record<"email" | "password", string[]>>
}

export const INITIAL_SIGN_IN_STATE: SignInActionState = {
  status: "idle",
}

