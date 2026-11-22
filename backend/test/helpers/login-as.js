// Logs the agent in through the demo login; the agent keeps the session cookie afterwards.
export async function loginAs(agent, userId) {
  const response = await agent.post('/api/v1/auth/mock-login').send({ userId });

  if (response.status !== 200) {
    throw new Error(
      `loginAs: logowanie użytkownika ${userId} nie powiodło się (status ${response.status}): ` +
        JSON.stringify(response.body),
    );
  }

  return response.body.user;
}
