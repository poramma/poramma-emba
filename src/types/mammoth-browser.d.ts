// Le build navigateur de mammoth (conversion .docx → HTML) n'expose pas ses types : on déclare le strict nécessaire.
declare module 'mammoth/mammoth.browser' {
  interface Message {
    type: string;
    message: string;
  }
  interface Result {
    value: string;
    messages: Message[];
  }
  const mammoth: {
    convertToHtml(input: { arrayBuffer: ArrayBuffer }, options?: Record<string, unknown>): Promise<Result>;
    images: { imgElement(handler: (image: unknown) => Promise<{ src: string }>): unknown };
  };
  export default mammoth;
}
