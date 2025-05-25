export interface SchoolNationPair {
  nation: string;
  school: string;
}

export interface ProcessedResult {
  postId: string;
  schools: string[];
  nations: string[];
}

export interface Post {
  id: string;
  title: {
    zh: string;
    vi: string;
    en: string;
  };
  content: {
    zh: string;
    vi: string;
    en: string;
  };
  created_at: string;
}
