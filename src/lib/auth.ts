export const SESSION_COOKIE_NAME = "scanright_session";

type OperatorCredential = {
  username: string;
  password: string;
  displayName: string;
};

const fallbackOperators: OperatorCredential[] = [
  {
    username: "operatore1",
    password: "scanright123",
    displayName: "Operatore 1",
  },
  {
    username: "operatore2",
    password: "scanright123",
    displayName: "Operatore 2",
  },
  {
    username: "operatore3",
    password: "scanright123",
    displayName: "Operatore 3",
  },
];

function fromEnv(index: number): OperatorCredential | null {
  const username = process.env[`TEST_OPERATOR_${index}_USERNAME`];
  const password = process.env[`TEST_OPERATOR_${index}_PASSWORD`];
  const displayName = process.env[`TEST_OPERATOR_${index}_DISPLAY_NAME`];

  if (!username || !password) return null;
  return {
    username,
    password,
    displayName: displayName || `Operatore ${index}`,
  };
}

export function getTestOperators(): OperatorCredential[] {
  const envOperators = [1, 2, 3]
    .map((index) => fromEnv(index))
    .filter((value): value is OperatorCredential => value !== null);

  return envOperators.length > 0 ? envOperators : fallbackOperators;
}

export function validateOperatorCredentials(
  username: string,
  password: string,
): OperatorCredential | null {
  return (
    getTestOperators().find(
      (operator) =>
        operator.username === username && operator.password === password,
    ) || null
  );
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function createSessionToken(operator: OperatorCredential): string {
  const payload = JSON.stringify({
    username: operator.username,
    displayName: operator.displayName,
    issuedAt: Date.now(),
  });
  return toBase64Url(payload);
}

export function readSessionToken(
  token: string | undefined,
): { username: string; displayName: string } | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(fromBase64Url(token)) as {
      username?: string;
      displayName?: string;
    };
    if (!payload.username || !payload.displayName) return null;
    return { username: payload.username, displayName: payload.displayName };
  } catch {
    return null;
  }
}
