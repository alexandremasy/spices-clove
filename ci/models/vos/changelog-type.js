const ChangelogType = {}

ChangelogType.ADD = 'add'
ChangelogType.EDIT = 'edit'
ChangelogType.DELETE = 'delete'

ChangelogType.ALL = [
  ChangelogType.ADD,
  ChangelogType.EDIT,
  ChangelogType.DELETE,
]

module.exports = ChangelogType