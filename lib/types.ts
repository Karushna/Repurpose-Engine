export type GeneratedPosts = {
  linkedin: string;
  xPost: string;
  instagram: string;
};

export type GenerateRequest = {
  content: string;
};

export type GenerateSuccessResponse = {
  success: true;
  data: GeneratedPosts;
};

export type GenerateErrorResponse = {
  success: false;
  error: string;
};

export type GenerateResponse =
  | GenerateSuccessResponse
  | GenerateErrorResponse;