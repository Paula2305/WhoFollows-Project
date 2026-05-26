export type FollowersJson = ReadonlyArray<{
  string_list_data: ReadonlyArray<{ value: string }>;
}>;

export type FollowingJson = {
  relationships_following: ReadonlyArray<{ title: string }>;
};

export type AnalysisResult = {
  notFollowingBack: string[];
  followingCount: number;
  followersCount: number;
};
