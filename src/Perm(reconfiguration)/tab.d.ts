interface _GroupItem {
    Perm: Array<string>;
    User: Array<string>;
}

interface _UserList extends Object<_GroupItem> {}

interface _UserInGroupItem {
    name: string;
    data: _GroupItem;
}

type _UserInGroup = Array<_UserInGroupItem>;
