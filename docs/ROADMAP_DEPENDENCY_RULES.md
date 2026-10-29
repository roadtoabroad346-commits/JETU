# Roadmap dependency rules

The generator emits a directed acyclic graph keyed by stable task keys. A mandatory prerequisite must be completed before its dependent task can be completed. Optional edges explain sequence without blocking completion. PostgreSQL rejects duplicate, self-referential and cyclic edges. It also rejects completion with unmet mandatory prerequisites and prevents reopening a completed prerequisite while a completed dependent remains. Task updates use optimistic versions.

The usual target chain is research → confirm requirements → verify documents → prepare application → review → submit through the official channel. Verified missing requirements and confirmed documents add branches into preparation. An unverified requirement or deadline creates a verification task. Exams are generated only from the selected target’s structured test requirement. Interview, visa and enrollment entries are conditional checks after the decision, not claims that these steps apply to every student.

Generated edges are replaced atomically on regeneration. Manual tasks and manual edges remain. Obsolete generated tasks are retained for history; completed tasks retain their status and notes. SQL and unit tests exercise cycles, duplicates, blocked completion, reopening and ordering.
