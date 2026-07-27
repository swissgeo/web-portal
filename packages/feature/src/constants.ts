// identify strategy should always receive an extent. If during implementation, we notice
// it is impossible to do and need to be able to send points, we'll need this constant.
// Which means, this constant might be removed by the end of the implementation of the feature
// module
export const IDENTIFY_TOLERANCE_PX = 10;

// in the old viewer, there was a limit, and the possibility to load more if needed.
export const FEATURE_LIMIT = 10;
