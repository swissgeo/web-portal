/** An error telling which request failed, so the user can report it. */
export class RequestError extends Error {
  url: string | null;

  constructor(message: string, url: string | null, options?: ErrorOptions) {
    super(message, options);
    this.name = "RequestError";
    this.url = url;
  }
}
