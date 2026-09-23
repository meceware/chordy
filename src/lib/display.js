// Rows seeded or saved without an artist still sort and read as Unknown, rather than an
// empty string sorting ahead of everything. Kept out of the query and component modules
// so both the server and the client can use it.
export function artistOf(song) {
  return song.artist || 'Unknown';
}
