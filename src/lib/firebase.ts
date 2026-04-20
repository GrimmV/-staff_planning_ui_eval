import { PUBLIC_FIREBASE_DATABASE_URL } from "$env/static/public";

type ClickEvent = Record<string, unknown> & {
  username: string;
};

export default function uploadClicks(click: ClickEvent) {
  const payload = {
    ...click,
    datetime: new Date(),
  };

  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    redirect: "follow",
  };

  return fetch(`${PUBLIC_FIREBASE_DATABASE_URL}${click.username}.json`, requestOptions)
    .then((response) => response.json())
    .catch((error) => console.log("error", error));
}
