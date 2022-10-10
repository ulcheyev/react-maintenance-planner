export default class Constants {
  static ITEM_EDIT = 'item-edit'
  static ITEM_ADD = 'item-add'
  static RESOURCE_EDIT = 'resource-edit'
  static RESOURCE_ADD = 'resource-add'
  static RESOURCE_REMOVE = 'resource-remove'
  static RESOURCE_REORDER = 'resource-reorder'
  static MILESTONE_ADD = 'milestone-add'
  static MILESTONE_EDIT = 'milestone-edit'
  static ITEM_DELETE = 'item-delete'
  static MILESTONE_DELETE = 'milestone-delete'
  static DEFAULT_LEGEND_ITEMS = [
    {
      name: "Current selection & parents/children",
      color: "#FFC107",
    },
    {
      name: "Non-movable item",
      color:
          "repeating-linear-gradient( -45deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0) 2px, #465298 2px, #465298 4px )",
    },
  ];
}