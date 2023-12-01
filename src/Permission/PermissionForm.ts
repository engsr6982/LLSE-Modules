import PermissionCore from "./PermissionCore.js";

export default class PermissionForm {
    /** i18n存储路径 */
    private i18nStoragePath: string;

    tr = (() => {
        if (i18n.tr("title") == "title" || i18n.tr("title") == "") this.i18nFileInit(); // 检查，防止i18n失效
        return i18n.tr;
    })();

    i18nFileInit(): boolean {
        try {
            i18n.load(this.i18nStoragePath, "zh_CN");
            return true;
        } catch (err) {
            return false;
        }
    }
    /**
     * 权限组GUI模块
     * @param i18nStoragePath i18n存储路径
     * @param permissionCoreInstance 权限组实例（函数返回已实例化的权限组）
     */
    constructor(i18nStoragePath: string, permissionCoreInstance: () => PermissionCore) {
        this.i18nStoragePath = i18nStoragePath;
        this.getPermInst = permissionCoreInstance;
        this.i18nFileInit();
    }

    /** 获取权限组实例 */
    private getPermInst: () => PermissionCore;
    /** 按钮表单 */
    private simpleForm() {
        return mc.newSimpleForm().setTitle(this.tr("title")).setContent(this.tr("content"));
    }
    /** 自定义表单 */
    private customForm() {
        return mc.newCustomForm().setTitle(this.tr("title"));
    }
    /** 表单关闭 */
    private formClose(player: Player): boolean {
        return player.tell(this.tr("formClose"));
    }

    /**
     * 表单入口
     * @param player
     */
    index(player: Player) {
        const p = this.getPermInst();
        if (p.isAdmin(player.xuid)) return player.tell(this.tr("noPermissions")); // 无权限
        const fm = this.simpleForm();
        fm.addButton(this.tr("index.0"));
        fm.addButton(this.tr("index.1"));
        fm.addButton(this.tr("index.2"));
        fm.addButton(this.tr("index.3"));
        player.sendForm(fm, (pl, id) => {
            switch (id) {
                case 0:
                    this.viewPanel(pl);
                    break;
                case 1:
                    this.editPanel(pl);
                    break;
                case 2:
                    this.searchPanel(pl);
                    break;
                case 3:
                    this.editPublicGroupForm(pl);
                    break;
                default:
                    this.formClose(pl);
            }
        });
    }

    /**
     * 查看面板
     * @param player
     */
    private viewPanel(player: Player) {
        const fm = this.simpleForm();
        fm.addButton(this.tr("view.0")); // back
        fm.addButton(this.tr("view.1"));
        fm.addButton(this.tr("view.2"));
        player.sendForm(fm, (pl, id) => {
            switch (id) {
                case 0:
                    this.index(pl);
                    break;
                case 1:
                    this.viewForm(pl, this.getPermInst().getAllGroups());
                    break;
                case 2:
                    this.selectGroup(pl, (name) => {
                        this.viewForm(pl, [this.getPermInst().getGroup(name).group]);
                    });
                    break;
                default:
                    this.formClose(pl);
            }
        });
    }

    /**
     * 编辑面板
     * @param player
     */
    private editPanel(player: Player) {
        const fm = this.simpleForm();
        fm.addButton(this.tr("edit.0")); // back
        fm.addButton(this.tr("edit.1"));
        fm.addButton(this.tr("edit.2"));
        fm.addButton(this.tr("edit.3"));
        fm.addButton(this.tr("edit.4"));
        fm.addButton(this.tr("edit.5"));
        player.sendForm(fm, (pl, id) => {
            switch (id) {
                case 0:
                    this.index(pl);
                    break;
                case 1:
                    this.createGroupForm(pl);
                    break;
                case 2:
                    this.deleteGroupForm(pl);
                    break;
                case 3:
                    this.renameGroupForm(pl);
                    break;
                case 4:
                    this.selectCategory(pl, (isAdd) => {
                        if (isAdd) {
                            this.addUserForm(pl);
                        } else {
                            this.deleteUserForm(pl);
                        }
                    });
                    break;
                case 5:
                    this.editPermissionForm(pl);
                    break;
                default:
                    this.formClose(pl);
            }
        });
    }

    /**
     * 搜索面板
     * @param player
     */
    private searchPanel(player: Player) {
        const fm = this.simpleForm();
        fm.addButton(this.tr("search.0")); // back
        fm.addButton(this.tr("search.1"));
        fm.addButton(this.tr("search.2"));
        fm.addButton(this.tr("search.3"));
        player.sendForm(fm, (pl, id) => {
            switch (id) {
                case 0:
                    this.index(pl);
                    break;
                case 1:
                    this.searchUserGroupForm(pl);
                    break;
                case 2:
                    this.searchUserPermissionForm(pl);
                    break;
                case 3: // todo 用户权限的来源
                    break;
                default:
                    this.formClose(pl);
            }
        });
    }

    /**
     * 继续表单
     * @param player 玩家对象
     * @param callback 回调，是否继续操作
     */
    private continueForm(player: Player, func: (pl: Player) => any) {
        player.sendModalForm(this.tr("title"), this.tr("continueForm.content"), this.tr("continueForm.button0"), this.tr("continueForm.button1"), (pl, res) => {
            if (res == null || res == false) return this.formClose(pl);
            func.call(this, pl);
        });
    }

    private selectGroup(player: Player, callback: (groupName: string) => any): void {
        const cache = []; // 缓存组名称
        const fm = this.simpleForm();
        fm.setContent(this.tr("selectGroup.content")); // 设置内容
        this.getPermInst()
            .getAllGroups()
            .forEach((group) => {
                fm.addButton(
                    this.tr("selectGroup.button", {
                        0: group.groupName,
                        1: group.authority.length,
                        2: group.user.length,
                    })
                );
                cache.push(group.groupName); // 添加进缓存
            });
        player.sendForm(fm, (pl, id) => {
            if (id == null) return this.formClose(pl);
            callback(cache[id]); // 返回指定组
        });
    }

    /**
     * 查看权限组表单
     * @param player 玩家对象
     * @param viewData 要查看的数据
     */
    private viewForm(player: Player, viewData: Array<UserGroupElements>) {
        // log(JSON.stringify(viewData, null, 2));
        const p = this.getPermInst(); // 获取权限核心实例
        const fm = this.customForm();
        if (viewData.length !== 0) {
            for (let i = 0; i < viewData.length; i++) {
                const { groupName, user, authority } = viewData[i]; // 取出组元素
                fm.addLabel(
                    this.tr("viewForm", {
                        0: groupName,
                        1: authority
                            .map((value) => {
                                return p.getPermission(value) || value; // 尝试权限组查找名称
                            })
                            .join(`§r §l§e| §r`),
                        2: user
                            .map((xuid) => {
                                return data.xuid2name(xuid) || xuid; // 尝试xuid查找名称
                            })
                            .join(`§r §l§e| §r`),
                    })
                );
            }
        }
        player.sendForm(fm, (pl) => {
            this.continueForm(pl, () => this.index(pl));
        });
    }

    /**
     * 输入为空
     * @param player
     * @returns
     */
    private inputIsEmpty(player: Player) {
        return player.tell(this.tr("inputIsEmpty"));
    }

    /**
     * 创建组表单
     * @param player
     */
    private createGroupForm(player: Player) {
        const p = this.getPermInst();
        const fm = this.customForm();
        fm.addInput(this.tr("createGroupForm"), "string 1~16 length");
        player.sendForm(fm, (pl, dt: Array<string>) => {
            if (dt == null) return this.formClose(pl);
            if (dt[0] == "") return this.inputIsEmpty(pl);
            p.createGroup(dt[0]);
            this.continueForm(pl, () => this.editPanel(pl)); // 回调-连锁操作
        });
    }

    /**
     * 删除组表单
     * @param player
     */
    private deleteGroupForm(player: Player) {
        this.selectGroup(player, (name) => {
            const { user, authority } = this.getPermInst().getGroup(name).group;
            player.sendModalForm(
                this.tr("title"),
                this.tr("deleteGroupForm.content", {
                    0: name,
                    1: user.length,
                    2: authority.length,
                }),
                this.tr("deleteGroupForm.button0"),
                this.tr("deleteGroupForm.button1"),
                (pl, res) => {
                    switch (res) {
                        case true:
                            this.getPermInst().deleteGroup(name);
                            this.continueForm(pl, () => this.editPanel(pl)); // 继续
                            break;
                        case false:
                            this.editPanel(pl);
                            break;
                        default:
                            this.formClose(pl);
                    }
                }
            );
        });
    }

    /**
     * 重命名组表单
     * @param player
     */
    private renameGroupForm(player: Player) {
        this.selectGroup(player, (name) => {
            const fm = this.customForm();
            fm.addInput(this.tr("renameGroupForm", { 0: name }), "string 1~16 length");
            player.sendForm(fm, (pl, dt) => {
                if (dt == null) return this.formClose(pl);
                if (dt[0] == "") return this.inputIsEmpty(pl);
                this.getPermInst().renameGroup(name, dt[0]);
                this.continueForm(pl, () => this.editPanel(pl));
            });
        });
    }

    /**
     * 编辑权限表单
     * @param player
     */
    private editPermissionForm(player: Player) {
        this.selectGroup(player, (groupName) => {
            const p = this.getPermInst(); // 权限组实例
            const allPermissionName = p
                .getAllPermissions() // 获取所有已注册权限
                .map(({ value }) => value); // 取出权限值
            const oldData = {}; // 原始数据
            const newData = {}; // 变动数据
            // form
            const fm = this.customForm().addLabel(`Edit Group: ${groupName}`);
            allPermissionName.forEach((i) => {
                const isHave = p.groupHasSpecifiedPermissions(groupName, i); // 检查是否有这个权限
                oldData[i] = isHave; // 缓存
                const pm = p.getPermission(i);
                fm.addSwitch(pm ? pm.name : i, isHave);
            });
            player.sendForm(fm, (pl, dt: Array<string>) => {
                if (dt == null) return this.formClose(pl);
                dt.shift(); // 去除第一个文本元素
                for (let i = 0; i < dt.length; i++) {
                    newData[allPermissionName[i]] = dt[i]; // 构建变动数据，用于辅助判断
                }
                allPermissionName.forEach((PermValue) => {
                    if (oldData[PermValue] === false && newData[PermValue] === true) {
                        // 如果原始数据false，新数据true，则添加权限
                        p.groupAddPermissions(groupName, PermValue);
                    } else if (oldData[PermValue] === true && newData === false) {
                        // 如果原始数据true，新数据false，则删除权限
                        p.groupDeletePermissions(groupName, PermValue);
                    }
                    // 剩余情况：
                    // 1. 原始false  新false   忽略
                    // 2. 原始true   新true    忽略
                });
                this.continueForm(pl, () => this.editPanel(pl));
            });
        });
    }

    /**
     * 编辑公共组表单
     * @param player
     */
    private editPublicGroupForm(player: Player) {
        const groupName = "PublicGroup";
        const p = this.getPermInst(); // 权限组实例
        const allPermissionName = p
            .getAllPermissions() // 获取所有已注册权限
            .map(({ value }) => value); // 取出权限值
        const oldData = {}; // 原始数据
        const newData = {}; // 变动数据
        // form
        const fm = this.customForm().addLabel(`Edit Group: ${groupName}`);
        allPermissionName.forEach((i) => {
            const isHave = p.groupHasSpecifiedPermissions(groupName, i);
            oldData[i] = isHave;
            const pm = p.getPermission(i);
            fm.addSwitch(pm ? pm.name : i, isHave);
        });
        player.sendForm(fm, (pl, dt: Array<string>) => {
            if (dt == null) return this.formClose(pl);
            dt.shift();
            for (let i = 0; i < dt.length; i++) {
                newData[allPermissionName[i]] = dt[i];
            }
            allPermissionName.forEach((PermValue) => {
                if (oldData[PermValue] === false && newData[PermValue] === true) {
                    p.publicGroupAddPermissions(PermValue);
                } else if (oldData[PermValue] === true && newData === false) {
                    p.publicGroupDeletePermissions(PermValue);
                }
            });
            this.continueForm(pl, () => this.index(pl));
        });
    }

    /**
     * 选择类别
     * @param player
     */
    private selectCategory(player: Player, callback: (isAdd: boolean) => any) {
        const fm = this.simpleForm();
        fm.addButton(this.tr("selectCategory.button0"));
        fm.addButton(this.tr("selectCategory.button1"));
        fm.addButton(this.tr("selectCategory.button2"));
        player.sendForm(fm, (pl, id) => {
            if (id == null) return this.formClose(pl);
            if (id === 0) return this.editPanel(pl);
            callback(id === 1 ? true : false);
        });
    }

    /**
     * 添加用户表单
     * @param player
     */
    private addUserForm(player: Player) {
        this.selectGroup(player, (groupName) => {
            const allPlayer = mc.getOnlinePlayers();
            const fm = this.customForm();
            fm.addLabel(`Edit Group: ${groupName}`); // 0
            fm.addStepSlider(this.tr("addUserForm.stepSliderTitle"), Array.of(this.tr("addUserForm.stepSliderItem0"), this.tr("addUserForm.stepSliderItem1"))); // 1
            fm.addDropdown(
                this.tr("addUserForm.dropdownTitle"),
                allPlayer.map((apl) => apl.realName)
            ); // 2
            fm.addInput(this.tr("addUserForm.inputTitle"), "string player name"); //3
            player.sendForm(fm, (pl, dt) => {
                if (dt == null) return this.formClose(pl);
                const xuid = dt[1] === 0 ? allPlayer[dt[2]].xuid : dt[3] != "" ? data.name2xuid(dt[3]) : this.inputIsEmpty(pl) ? null : null;
                // 检查XUID
                if (xuid) {
                    this.getPermInst().groupAddUser(groupName, xuid);
                    this.continueForm(player, () => this.editPanel(pl));
                } else pl.tell(this.tr("xuidNull"));
            });
        });
    }

    /**
     * 删除用户表单
     * @param player
     */
    private deleteUserForm(player: Player) {
        this.selectGroup(player, (groupName) => {
            const p = this.getPermInst();
            const groupUser = this.getPermInst().getGroup(groupName).group.user; // 所有用户
            const fm = this.customForm();
            fm.addLabel(this.tr("deleteUserForm", { 0: groupName }));
            groupUser.forEach((i) => {
                fm.addSwitch(data.xuid2name(i) || i, false);
            });
            player.sendForm(fm, (pl, dt: Array<boolean>) => {
                if (dt == null) return this.formClose(pl);
                dt.shift(); // 去除Label
                for (let i = 0; i < dt.length; i++) {
                    dt[i] ? p.groupDeleteUser(groupName, groupUser[i]) : null; // 如果开关变为true，则代表删除用户
                }
                this.continueForm(pl, () => this.editPanel(pl));
            });
        });
    }

    /**
     * 搜索组件
     * @param player
     * @param callback 回调玩家XUID/null
     */
    private searchComponent(player: Player, callback: (xuid) => any) {
        const allPlayer = mc.getOnlinePlayers();
        const fm = this.customForm();
        /* 0 */ fm.addStepSlider(this.tr("searchComponent.stepSliderTitle"), Array.of(this.tr("searchComponent.stepSliderItem0"), this.tr("searchComponent.stepSliderItem1")));
        /* 1 */ fm.addDropdown(
            this.tr("searchComponent.dropdownTitle"),
            allPlayer.map((apl) => apl.realName)
        );
        /* 2 */ fm.addInput(this.tr("searchComponent.inputTitle"), "string player name");
        player.sendForm(fm, (pl, dt) => {
            if (dt == null) return this.formClose(pl);
            callback(dt[0] === 0 ? allPlayer[dt[1]].xuid : dt[2] != "" ? data.name2xuid(dt[2]) : this.inputIsEmpty(pl) ? null : null);
        });
    }

    /**
     * 搜索用户组
     * @param player
     */
    private searchUserGroupForm(player: Player) {
        this.searchComponent(player, (xuid) => {
            if (xuid === null) return player.tell(this.tr("xuidNull"));
            const group = this.getPermInst().getUserGroups(xuid);
            // log(`xuid: ${xuid}`);
            // log(`\n${JSON.stringify(group, null, 2)}`);
            group.length !== 0 ? this.viewForm(player, group) : player.tell(this.tr("searchUserGroupForm"));
        });
    }

    /**
     * 搜索用户权限
     * @param player
     */
    private searchUserPermissionForm(player: Player) {
        this.searchComponent(player, (xuid) => {
            if (xuid === null) return player.tell(this.tr("xuidNull"));
            const p = this.getPermInst();
            const { authority, source } = p.getUserPermissions(xuid); // 获取用户的权限
            // form
            const fm = this.customForm();
            for (const key in source) {
                // 遍历权限
                const inf = p.getPermission(key); // 获取权限详细信息
                fm.addLabel(
                    this.tr("searchUserPermissionForm.Label-0", {
                        0: inf ? inf.name : key, // 显示权限名
                        1: source[key].join(`§r §l§e| §r`), // 显示来源
                    })
                );
            }
            // 显示统计信息
            fm.addLabel(
                this.tr("searchUserPermissionForm.Label-1", {
                    0: data.xuid2name(xuid) || xuid,
                    1: authority.length,
                })
            );
            player.sendForm(fm, (pl) => {
                this.continueForm(pl, () => this.searchPanel(pl));
            });
        });
    }
}