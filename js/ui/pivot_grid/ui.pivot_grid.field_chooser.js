"use strict";

var $ = require("../../core/renderer"),
    iconUtils = require("../../core/utils/icon"),
    hasWindow = require("../../core/utils/window").hasWindow(),
    isDefined = require("../../core/utils/type").isDefined,
    extend = require("../../core/utils/extend").extend,
    inArray = require("../../core/utils/array").inArray,
    iteratorUtils = require("../../core/utils/iterator"),
    messageLocalization = require("../../localization/message"),
    registerComponent = require("../../core/component_registrator"),
    pivotGridUtils = require("./ui.pivot_grid.utils"),
    TreeView = require("../tree_view"),
    ContextMenu = require("../context_menu"),
    BaseFieldChooser = require("./ui.pivot_grid.field_chooser_base"),
    inArray = inArray,
    each = iteratorUtils.each,
    DIV = "<div>";

require("./data_source");

var FIELDCHOOSER_CLASS = "dx-pivotgridfieldchooser",
    FIELDCHOOSER_CONTAINER_CLASS = "dx-pivotgridfieldchooser-container",
    FIELDS_CONTAINER_CLASS = "dx-pivotgrid-fields-container",
    AREA_DRAG_CLASS = "dx-pivotgrid-drag-action";

function getDimensionFields(item, fields) {
    var result = [];

    if(item.items) {
        for(var i = 0; i < item.items.length; i++) {
            result.push.apply(result, getDimensionFields(item.items[i], fields));
        }
    } else {
        if(isDefined(item.index)) {
            result.push(fields[item.index]);
        }
    }
    return result;
}

function getFirstItem(item, condition) {
    if(item.items) {
        for(var i = 0; i < item.items.length; i++) {
            var childrenItem = getFirstItem(item.items[i], condition);
            if(childrenItem) {
                return childrenItem;
            }
        }
    }

    if(condition(item)) {
        return item;
    }
}

var compareOrder = [
    function(a, b) {
        var aValue = -(!!(a.isMeasure)),
            bValue = +(!!(b.isMeasure));

        return aValue + bValue;
    },

    function(a, b) {
        var aValue = -(!!(a.items && a.items.length)),
            bValue = +(!!(b.items && b.items.length));

        return aValue + bValue;
    },

    function(a, b) {
        var aValue = +(!!(a.field && a.field.levels && a.field.levels.length)),
            bValue = -(!!(b.field && b.field.levels && b.field.levels.length));

        return aValue + bValue;
    },
    pivotGridUtils.getCompareFunction(function(item) { return item.text; })
];

function compareItems(a, b) {
    var result = 0,
        i = 0;

    while(!result && compareOrder[i]) {
        result = compareOrder[i++](a, b);
    }

    return result;
}

function getScrollable(container) {
    return container.find(".dx-scrollable").dxScrollable("instance");
}

var FieldChooser = BaseFieldChooser.inherit({
    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            /**
            * @name dxPivotGridFieldChooserOptions_height
            * @publicName height
            * @type number|string|function
            * @default 400
            * @type_function_return number|string
            */
            height: 400,
            /**
             * @name dxPivotGridFieldChooserOptions_layout
             * @publicName layout
             * @type Enums.PivotGridFieldChooserLayout
             * @default 0
             */
            layout: 0,
            /**
             * @name dxPivotGridFieldChooserOptions_dataSource
             * @publicName dataSource
             * @type PivotGridDataSource
             * @default null
             * @ref
             */
            dataSource: null,
            /**
            * @name dxPivotGridFieldChooserOptions_onContextMenuPreparing
            * @publicName onContextMenuPreparing
            * @type function(e)
            * @type_function_param1 e:object
            * @type_function_param1_field4 items:Array<Object>
            * @type_function_param1_field5 area:string
            * @type_function_param1_field6 field:PivotGridDataSourceOptions_fields
            * @type_function_param1_field7 jQueryEvent:jQuery.Event:deprecated(event)
            * @type_function_param1_field8 event:event
            * @extends Action
            * @action
            */
            onContextMenuPreparing: null,
            /**
            * @name dxPivotGridFieldChooserOptions_allowSearch
            * @publicName allowSearch
            * @type boolean
            * @default false
            */
            allowSearch: false,
            /**
             * @name dxPivotGridFieldChooserOptions_texts
             * @publicName texts
             * @type object
             */
            texts: {
                /**
                 * @name dxPivotGridFieldChooserOptions_texts_columnFields
                 * @publicName columnFields
                 * @type string
                 * @default 'Column Fields'
                 */
                columnFields: messageLocalization.format("dxPivotGrid-columnFields"),
                /**
                 * @name dxPivotGridFieldChooserOptions_texts_rowFields
                 * @publicName rowFields
                 * @type string
                 * @default 'Row Fields'
                 */
                rowFields: messageLocalization.format("dxPivotGrid-rowFields"),
                /**
                 * @name dxPivotGridFieldChooserOptions_texts_dataFields
                 * @publicName dataFields
                 * @type string
                 * @default 'Data Fields'
                 */
                dataFields: messageLocalization.format("dxPivotGrid-dataFields"),
                /**
                 * @name dxPivotGridFieldChooserOptions_texts_filterFields
                 * @publicName filterFields
                 * @type string
                 * @default 'Filter Fields'
                 */
                filterFields: messageLocalization.format("dxPivotGrid-filterFields"),
                /**
                 * @name dxPivotGridFieldChooserOptions_texts_allFields
                 * @publicName allFields
                 * @type string
                 * @default 'All Fields'
                 */
                allFields: messageLocalization.format("dxPivotGrid-allFields")
            },
            /**
            * @name dxPivotGridFieldChooserOptions_applyChangesMode
            * @publicName applyChangesMode
            * @type Enums.ApplyChangesMode
            * @default "instantly"
            */
           /**
            * @name dxPivotGridFieldChooserOptions_state
            * @publicName state
            * @type object
            * @default null
            */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter
             * @publicName headerFilter
             * @type object
             */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter_width
             * @publicName width
             * @type number
             * @default 252
             */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter_height
             * @publicName height
             * @type number
             * @default 325
             */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter_allowSearch
             * @publicName allowSearch
             * @type boolean
             * @default undefined
             */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter_texts
             * @publicName texts
             * @type object
             */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter_texts_emptyValue
             * @publicName emptyValue
             * @type string
             * @default "(Blanks)"
             */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter_texts_ok
             * @publicName ok
             * @type string
             * @default "Ok"
             */
            /**
             * @name dxPivotGridFieldChooserOptions_headerFilter_texts_cancel
             * @publicName cancel
             * @type string
             * @default "Cancel"
             */
        });
    },

    _refreshDataSource: function() {
        var that = this;
        that._expandedPaths = [];
        that._changedHandler = that._changedHandler || function() {
            each(that._dataChangedHandlers, function(_, func) {
                func();
            });
            that._fireContentReadyAction();
        };

        if(that._dataSource) {
            that._dataSource.off("changed", that._changedHandler);
            that._dataSource = undefined;
        }

        that.callBase();

        that._dataSource && that._dataSource.on("changed", that._changedHandler);
    },

    _init: function() {
        this.callBase();
        this._refreshDataSource();
        this._dataChangedHandlers = [];
        this._initActions();
    },

    _initActions: function() {
        this._actions = {
            onContextMenuPreparing: this._createActionByOption("onContextMenuPreparing")
        };
    },

    _trigger: function(eventName, eventArg) {
        this._actions[eventName](eventArg);
    },

    _setOptionsByReference: function() {
        this.callBase();

        extend(this._optionsByReference, {
            dataSource: true
        });
    },

    _optionChanged: function(args) {
        var that = this;
        switch(args.name) {
            case "dataSource":
                that._refreshDataSource();
                that._invalidate();
                break;
            case "layout":
            case "texts":
            case "allowSearch":
                that._invalidate();
                break;
            case "onContextMenuPreparing":
                that._actions[args.name] = that._createActionByOption(args.name);
                break;
            default:
                that.callBase(args);
        }
    },

    _clean: function(saveState) {
        !saveState && this.option("state", null);
        this.$element().children("." + FIELDCHOOSER_CONTAINER_CLASS).remove();
    },

    _initMarkup: function() {
        var that = this,
            $element = this.$element(),
            $container = $(DIV).addClass(FIELDCHOOSER_CONTAINER_CLASS).appendTo($element),
            layout = that.option("layout"),
            $col1,
            $col2;

        that.callBase();

        $element
            .addClass(FIELDCHOOSER_CLASS)
            .addClass(FIELDS_CONTAINER_CLASS);

        that._dataChangedHandlers = [];

        if(layout === 0) {
            $col1 = $(DIV).addClass("dx-col").appendTo($container);
            $col2 = $(DIV).addClass("dx-col").appendTo($container);

            that._renderArea($col1, "all");
            that._renderArea($col1, "filter");
            that._renderArea($col2, "row");
            that._renderArea($col2, "column");
            that._renderArea($col2, "data");
        } else if(layout === 1) {
            $col1 = $(DIV).addClass("dx-col").appendTo($container);
            $col2 = $(DIV).addClass("dx-col").appendTo($container);

            that._renderArea($col1, "all");
            that._renderArea($col2, "filter");
            that._renderArea($col2, "row");
            that._renderArea($col2, "column");
            that._renderArea($col2, "data");
        } else {
            $container.addClass("dx-layout-2");
            this._renderArea($container, "all");
            var $layout2Container = $(DIV).addClass("dx-fields-container").appendTo($container);

            $col1 = $(DIV).addClass("dx-col").appendTo($layout2Container);
            $col2 = $(DIV).addClass("dx-col").appendTo($layout2Container);

            that._renderArea($col1, "filter");
            that._renderArea($col1, "row");
            that._renderArea($col2, "column");
            that._renderArea($col2, "data");
        }
    },

    _renderContentImpl: function() {
        this.callBase();

        this.renderSortable();
        this._renderContextMenu();
        this.updateDimensions();
    },

    _fireContentReadyAction: function() {
        if(!this._dataSource || !this._dataSource.isLoading()) {
            this.callBase();
        }
    },

    _getContextMenuArgs: function(dxEvent) {
        var targetFieldElement = $(dxEvent.target).closest(".dx-area-field"),
            targetGroupElement = $(dxEvent.target).closest(".dx-area-fields"),
            field,
            area;

        if(targetFieldElement.length) {
            field = targetFieldElement.data("field");

        }

        if(targetGroupElement.length) {
            area = targetGroupElement.attr("group");
        }

        return {
            event: dxEvent,
            field: field,
            area: area,
            items: []
        };
    },

    _renderContextMenu: function() {
        var that = this,
            $container = that.$element();

        if(that._contextMenu) {
            that._contextMenu.$element().remove();
        }

        that._contextMenu = that._createComponent($(DIV).appendTo($container), ContextMenu, {
            onPositioning: function(actionArgs) {
                var event = actionArgs.event,
                    args;

                if(!event) {
                    return;
                }

                args = that._getContextMenuArgs(event);

                that._trigger("onContextMenuPreparing", args);

                if(args.items && args.items.length) {
                    actionArgs.component.option("items", args.items);
                } else {
                    actionArgs.cancel = true;
                }
            },
            target: $container,
            onItemClick: function(params) {
                params.itemData.onItemClick && params.itemData.onItemClick(params);
            },
            cssClass: "dx-pivotgridfieldchooser-context-menu"
        });
    },

    _createTreeItems: function(fields, groupFieldNames, path) {
        var that = this,
            isMeasure,
            resultItems = [],
            groupedItems = [],
            groupFieldName = groupFieldNames[0],
            fieldsByGroup = {};

        if(!groupFieldName) {
            each(fields, function(index, field) {
                var icon;

                if(field.isMeasure === true) {
                    icon = "measure";
                }

                if(field.isMeasure === false) {
                    icon = field.groupName ? "hierarchy" : "dimension";
                }

                resultItems.push({
                    index: field.index,
                    field: field,
                    key: field.dataField,
                    selected: isDefined(field.area),
                    text: field.caption || field.dataField,
                    icon: icon,
                    isMeasure: field.isMeasure,
                    isDefault: field.isDefault
                });
            });
        } else {
            each(fields, function(index, field) {
                var groupName = field[groupFieldName] || "";
                fieldsByGroup[groupName] = fieldsByGroup[groupName] || [];
                fieldsByGroup[groupName].push(field);

                if(isMeasure === undefined) {
                    isMeasure = true;
                }
                isMeasure = isMeasure && field.isMeasure === true;
            });

            each(fieldsByGroup, function(groupName, fields) {
                var currentPath = path ? path + '.' + groupName : groupName;
                var items = that._createTreeItems(fields, groupFieldNames.slice(1), currentPath);
                if(groupName) {
                    groupedItems.push({
                        key: groupName,
                        text: groupName,
                        path: currentPath,
                        isMeasure: items.isMeasure,
                        expanded: inArray(currentPath, that._expandedPaths) >= 0,
                        items: items
                    });
                } else {
                    resultItems = items;
                }
            });

            resultItems = groupedItems.concat(resultItems);
            resultItems.isMeasure = isMeasure;
        }

        return resultItems;
    },

    _createFieldsDataSource: function(dataSource) {
        var fields = dataSource && dataSource.fields() || [],
            treeItems;

        fields = iteratorUtils.map(fields, function(field) {
            return field.visible === false || isDefined(field.groupIndex) ? null : field;
        });

        treeItems = this._createTreeItems(fields, ["dimension", "displayFolder"]);

        pivotGridUtils.foreachDataLevel(treeItems, function(items) {
            items.sort(compareItems);
        }, 0, "items");

        return treeItems;
    },

    _renderFieldsTreeView: function(container) {
        var that = this,
            dataSource = that._dataSource,
            treeView = that._createComponent(container, TreeView, {
                dataSource: that._createFieldsDataSource(dataSource),
                showCheckBoxesMode: 'normal',
                searchEnabled: that.option("allowSearch"),
                itemTemplate: function(itemData, itemIndex, itemElement) {
                    if(itemData.icon) {
                        iconUtils.getImageContainer(itemData.icon).appendTo(itemElement);
                    }

                    $('<span>')
                        .toggleClass("dx-area-field", !itemData.items)
                        .data("field", itemData.field)
                        .text(itemData.text)
                        .appendTo(itemElement);
                },
                onItemCollapsed: function(e) {
                    var index = inArray(e.itemData.path, that._expandedPaths);
                    if(index >= 0) {
                        that._expandedPaths.splice(index, 1);
                    }
                },
                onItemExpanded: function(e) {
                    var index = inArray(e.itemData.path, that._expandedPaths);
                    if(index < 0) {
                        that._expandedPaths.push(e.itemData.path);
                    }
                },
                onItemSelectionChanged: function(e) {
                    var data = e.itemData,
                        field,
                        fields,
                        needSelectDefaultItem = true,
                        area;

                    if(data.items) {
                        if(data.selected) {
                            treeView.unselectItem(data);
                            return;
                        }
                        fields = getDimensionFields(data, dataSource.fields());

                        for(var i = 0; i < fields.length; i++) {
                            if(fields[i].area) {
                                needSelectDefaultItem = false;
                                break;
                            }
                        }

                        if(needSelectDefaultItem) {
                            var item = getFirstItem(data, function(item) { return item.isDefault; }) || getFirstItem(data, function(item) { return isDefined(item.index); });
                            item && treeView.selectItem(item);
                            return;
                        }
                    } else {
                        field = dataSource.fields()[data.index];
                        if(data.selected) {
                            area = (field.isMeasure ? "data" : "column");
                        }
                        if(field) {
                            fields = [field];
                        }
                    }

                    that._applyChanges(fields, {
                        area: area,
                        areaIndex: undefined
                    });
                }
            }),

            dataChanged = function() {
                var scrollable = getScrollable(container),
                    scrollTop = scrollable ? scrollable.scrollTop() : 0;

                treeView.option({ dataSource: that._createFieldsDataSource(dataSource) });
                scrollable = getScrollable(container);
                if(scrollable) {
                    scrollable.scrollTo({ y: scrollTop });
                    scrollable.update();
                }
            };

        that._dataChangedHandlers.push(dataChanged);
    },

    _renderAreaFields: function($container, area) {
        var that = this,
            dataSource = that._dataSource,
            fields = dataSource ? dataSource.getAreaFields(area, true) : [];

        $container.empty();
        each(fields, function(_, field) {
            if(field.visible !== false) {
                that.renderField(field, true).appendTo($container);
            }
        });
    },

    _renderArea: function(container, area) {
        var that = this,
            $areaContainer = $(DIV).addClass("dx-area").appendTo(container),
            $fieldsHeaderContainer = $(DIV).addClass("dx-area-fields-header").appendTo($areaContainer),
            caption = that.option("texts." + area + "Fields"),
            $fieldsContainer,
            $fieldsContent,
            render;

        $("<span>").addClass("dx-area-icon")
            .addClass("dx-area-icon-" + area)
            .appendTo($fieldsHeaderContainer);

        $("<span>")
            .html("&nbsp;")
            .appendTo($fieldsHeaderContainer);

        $("<span>").addClass("dx-area-caption")
            .text(caption)
            .appendTo($fieldsHeaderContainer);

        $fieldsContainer = $(DIV).addClass("dx-area-fields")
            .addClass(AREA_DRAG_CLASS)
            .appendTo($areaContainer);

        if(area !== "all") {
            $fieldsContainer.attr("group", area).attr("allow-scrolling", true);
            $fieldsContent = $(DIV).addClass("dx-area-field-container").appendTo($fieldsContainer);
            render = function() {
                that._renderAreaFields($fieldsContent, area);
            };
            that._dataChangedHandlers.push(render);
            render();
            $fieldsContainer.dxScrollable();
        } else {
            $areaContainer.addClass("dx-all-fields");
            $fieldsContainer.addClass("dx-treeview-border-visible");
            that._renderFieldsTreeView($fieldsContainer);
        }
    },

    _getSortableOptions: function() {
        // TODO
        return {

        };
    },

    _adjustSortableOnChangedArgs: function() {
    },

    resetTreeView: function() {
        var treeView = this.$element().find(".dx-treeview").dxTreeView("instance");

        if(treeView) {
            treeView.option("searchValue", "");
            treeView.collapseAll();
        }
    },

    /**
    * @name dxPivotGridFieldChooserMethods_applyChanges
    * @publicName applyChanges()
    */
    applyChanges: function() {
        var state = this.option("state");

        if(isDefined(state)) {
            this._dataSource.state(state);
            this.option("state", null);
        }
    },

    /**
    * @name dxPivotGridFieldChooserMethods_cancelChanges
    * @publicName cancelChanges()
    */
    cancelChanges: function() {
        if(isDefined(this.option("state"))) {
            var state = this._dataSource.state();
            this.option("state", null);

            this._dataSource.state(state);
        }
    },

    /**
    * @name dxPivotGridFieldChooserMethods_getDataSource
    * @publicName getDataSource()
    * @return PivotGridDataSource
    */
    getDataSource: function() {
        return this._dataSource;
    },

    /**
    * @name dxPivotGridFieldChooserMethods_updateDimensions
    * @publicName updateDimensions()
    */
    updateDimensions: function() {
        var $scrollableElements = this.$element().find(".dx-area .dx-scrollable");
        $scrollableElements.dxScrollable("update");
    },

    _visibilityChanged: function(visible) {
        if(visible && hasWindow) {
            this.updateDimensions();
        }
    }
});

registerComponent("dxPivotGridFieldChooser", FieldChooser);

module.exports = FieldChooser;
