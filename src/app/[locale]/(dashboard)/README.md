# Private student routes

The group layout verifies signed claims before rendering. Individual reads also
resolve the current Auth user, and profile writes remain restricted by database
row level security.
