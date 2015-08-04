/**
 * Created by hvallee on 6/19/15.
 */

pcmApp.controller("InitializerCtrl", function($rootScope, $scope, $window, $http, $timeout, uiGridConstants, $location, pcmApi, expandeditor, typeService, editorOptions, editorUtil, sortFeaturesService) {

    $scope.height = 300;
    $scope.minWidth = 130;
    $scope.enableEdit = editorOptions.enableEdit;
    $scope.enableExport = editorOptions.enableExport;
    $scope.enableTitle = true;
    $scope.enableShare = editorOptions.enableShare;

    $scope.FeaturGroupIndex = 1;

    $scope.gridOptions = {
        headerTemplate: '/assets/templates/featureGroupHeader.html',
        superColDefs: [],
        columnDefs: [],
        data: 'pcmData',
        enableRowSelection: false,
        showColumnFooter: true,
        enableRowHeaderSelection: false,
        flatEntityAccess: true,
        enableColumnResizing: true,
        enableFiltering: true,
        enableCellSelection: false,
        enableCellEdit: false,
        headerRowHeight: 60,
        rowHeight: 28
    };
    $scope.columnMovedFunctions = [];
    $scope.beginCellEditFunctions = [];
    $scope.afterCellEditFunctions = [];
    $scope.onNavigateFunctions = [];

    $scope.loading = false;

    var contentValue;
    var rawValue;

    /* Grid event functions */
    $scope.setRawValue = function(rowEntity, colDef, rawValue, contentValue) {

        rawValue = $scope.pcmDataRaw[$scope.pcmData.indexOf(rowEntity)][colDef.name];
        contentValue = rowEntity[colDef.name];
        rowEntity[colDef.name] = rawValue;
    };

    $scope.setVisualRepresentation = function(rowEntity, colDef, newValue, oldValue, rawValue, contentValue) {

        if(newValue && rawValue != newValue) {
            $rootScope.$broadcast('modified');
            $scope.pcmData[$scope.pcmData.indexOf(rowEntity)][colDef.name] = getVisualRepresentation(newValue, $scope.pcmData.indexOf(rowEntity),
                colDef.name, rowEntity.$$hashKey, contentValue, rawValue, newValue);
        }
        else {
            $scope.pcmData[$scope.pcmData.indexOf(rowEntity)][colDef.name] = contentValue;
        }
        /* Update value based on visual representation and raw */
        $scope.pcmDataRaw[$scope.pcmData.indexOf(rowEntity)][colDef.name] = newValue;
    };

    $scope.moveColumnData = function(colDef, originalPosition, newPosition) {

        $scope.gridOptions.columnDefs.move(originalPosition, newPosition);
        var commandParameters = [originalPosition, newPosition];

        $scope.newCommand('move', commandParameters);
        $rootScope.$broadcast('modified');
    };
    $scope.columnMovedFunctions.push($scope.moveColumnData);
    $scope.beginCellEditFunctions.push($scope.setRawValue);
    $scope.afterCellEditFunctions.push($scope.setVisualRepresentation);

    /* Register grid functions */
    $scope.gridOptions.onRegisterApi = function(gridApi){


        //set gridApi on scope
        $scope.gridApi = gridApi;


        /* Called when columns are moved */
        gridApi.colMovable.on.columnPositionChanged($scope,function(colDef, originalPosition, newPosition){
            for(var i = 0; i <   $scope.columnsMovedFunctions.length; i++) {
                $scope.columnMovedFunctions[i]();
            }
        });

        gridApi.edit.on.beginCellEdit($scope, function(rowEntity, colDef) {
            for(var i = 0; i <   $scope.beginCellEditFunctions.length; i++) {
                $scope.beginCellEditFunctions[i](rowEntity, colDef, contentValue, rawValue);
            }

        });

        gridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue, oldValue){
            for(var i = 0; i <   $scope.afterCellEditFunctions.length; i++) {
                $scope.afterCellEditFunctions[i](rowEntity, colDef, newValue, oldValue, rawValue, contentValue);
            }
        });

        gridApi.cellNav.on.navigate($scope,function(rowEntity, colDef){
            for(var i = 0; i <   $scope.onNavigateFunctions.length; i++) {
                $scope.onNavigateFunctions[i](rowEntity, colDef);
            }
            var expandedFunctions = expandeditor.expandNavigateFunctions().navigateFunctions;
            for(var i = 0; i <   expandedFunctions.length; i++) {
                expandedFunctions[i](rowEntity, colDef);
            }
        });

        gridApi.colResizable.on.columnSizeChanged($scope,function(colDef, deltaChange){

            $scope.resizeFeatureGroup($scope.gridOptions.columnDefs, colDef, deltaChange);
        })

    };


    $scope.setGridHeight = function() {

        if($scope.pcmData) {
            if($scope.pcmData.length * 28 + 90 > $(window).height()* 2 / 3 && !editorUtil.GetUrlValue('enableEdit')) {
                $scope.height = $(window).height() * 2 / 3;
            }
            else if($scope.pcmData.length * 28 + 90 > $(window).height()) {
                $scope.height = $(window).height();
            }
            else{
                $scope.height = $scope.pcmData.length * 28 + 90;
            }
        }
    };

    function randomFeatureGroup (featureType) {
        var feature = '';
        switch(featureType) {
            case "string":
                feature = 'Feature Group 1';
                break;
            case "number":
                feature = 'Feature Group 2';
                break;
            case "boolean":
                feature = 'Feature Group 3';
                break;
        }
        return feature;
    }

    /**
     *  Create a new ColumnDef for the ui-grid
     * @param featureName
     * @param featureType
     * @returns colDef
     */
    $scope.newColumnDef = function(featureName, featureGroup, featureType) {
        if(!featureType) {
            featureType = "string";
        }
        if(featureGroup) {
            var featureGroupName = featureGroup
        }
        else {
            featureGroupName = 'empltyFeatureGroup';
        }
        var codedFeatureName = editorUtil.convertStringToEditorFormat(featureName);
        $scope.columnsType[codedFeatureName] = featureType;
        var columnDef = {
            name: codedFeatureName,
            displayName: featureName,
            width: '*',
            enableSorting: true,
            enableHiding: false,
            enableFiltering: true,
            enableColumnResizing: true,
            enableColumnMoving: $scope.edit,
            enableCellEdit: $scope.edit,
            enableCellEditOnFocus: $scope.edit,
            allowCellFocus: true,
            superCol: featureGroupName,
            filter: {term: ''},
            minWidth: $scope.minWidth,
            menuItems: [
                {
                    title: 'Hide',
                    icon: 'fa fa-eye-slash',
                    action: function($event) {
                        $scope.gridOptions.columnDefs.forEach(function(featureData) {
                            if(featureData.name === codedFeatureName) {
                                columnDef.visible = false;
                                $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
                            }
                        });
                        $rootScope.$broadcast('reloadFeatureGroup');
                    }
                },
                {
                    title: 'Rename Feature',
                    shown: function () {
                        return $scope.edit;
                    },
                    icon: 'fa fa-pencil',
                    action: function($event) {
                        $('#modalRenameFeature').modal('show');
                        $scope.oldFeatureName = featureName;
                        $scope.featureName = featureName;
                    }
                },
                {
                    title: 'Change Type',
                    shown: function () {
                        return $scope.edit;
                    },
                    icon: 'fa fa-exchange',
                    action: function($event) {
                        $('#modalChangeType').modal('show');
                        $scope.oldFeatureName = featureName;
                        $scope.featureName = featureName;
                        $scope.featureType = $scope.columnsType[codedFeatureName];
                    }
                },
                {
                    title: 'Delete Feature',
                    shown: function () {
                        return $scope.edit;
                    },
                    icon: 'fa fa-trash-o',
                    action: function($event) {
                        $scope.deleteFeature(codedFeatureName);
                    }
                },
                {
                    title: 'Unhide everything',
                    icon: 'fa fa-eye',
                    action: function($event) {
                        $scope.gridOptions.columnDefs.forEach(function(featureData) {
                            featureData.visible = true;
                        });
                        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
                        $rootScope.$broadcast('reloadFeatureGroup');
                    }
                }
            ],
            cellClass: function(grid, row, col) {
                var rowValue = $scope.pcmDataRaw[$scope.pcmData.indexOf(row.entity)];
                if($scope.validating && $scope.validation[col.name] && !$scope.validation[col.name][$scope.pcmData.indexOf(row.entity)]) {
                    return 'warningCell';
                }
                else if(rowValue) {
                    return editorUtil.getCellClass(rowValue[col.name], featureType);
                }
            },
            cellTooltip: function(row, col) {
                var rawValue = $scope.pcmDataRaw[$scope.pcmData.indexOf(row.entity)];
                var contentValue = $scope.pcmData[$scope.pcmData.indexOf(row.entity)];
                if($scope.validating && $scope.validation[col.name] && !$scope.validation[col.name][$scope.pcmData.indexOf(row.entity)]) {
                    return "This value doesn't seem to match the feature type.";
                }
                else if(rawValue && editorUtil.getCellTooltip(rawValue[col.name])){
                    return editorUtil.getCellTooltip(rawValue[col.name]);
                }
                else if(contentValue) {
                    return contentValue[col.name];
                }
            }
        };
        switch(featureType) {
            case "string":
                columnDef.filterHeaderTemplate="" +
                    "<div class='ui-grid-filter-container'>" +
                    "   <button class='btn btn-primary fa fa-search btn-sm' ng-click='grid.appScope.showFilter(col)'>" +
                    "   </button>" +
                    "   <button ng-show='grid.appScope.isFilterOn(col)' class='btn btn-default btn-sm fa fa-close'  ng-click='grid.appScope.removeFilter(col)'>" +
                    "   </button>" +
                    "</div>";
                columnDef.filter.noTerm = true;
                columnDef.filter.condition = function (searchTerm,  cellValue) {
                    return $scope.filterStringColumns(cellValue, codedFeatureName);
                };
                break;
            case "number":
                var filterLess = [];
                filterLess.condition  = function (searchTerm,  cellValue) {
                    return $scope.filterLessNumberColumns(cellValue, columnDef, codedFeatureName);
                };
                columnDef.filterHeaderTemplate="" +
                    "<div class='ui-grid-filter-container'>" +
                    "   <button class='btn btn-primary btn-sm fa fa-sliders' ng-click='grid.appScope.showFilter(col)' data-toggle='modal' data-target='#modalSlider'>" +
                    "   </button>" +
                    "   <button  ng-show='grid.appScope.isFilterOn(col)' class='btn btn-default btn-sm fa fa-close' ng-click='grid.appScope.removeFilter(col)'>" +
                    "   </button>" +
                    "</div>";
                var filterGreater = [];
                filterGreater.condition  = function (searchTerm,  cellValue) {
                    return $scope.filterGreaterNumberColumns(cellValue, columnDef, codedFeatureName);
                };
                columnDef.filters = [];
                columnDef.filters.push(filterGreater);
                columnDef.filters.push(filterLess);
                columnDef.footerCellTemplate = "<div class='ui-grid-cell-contents'><button class='btn btn-primary fa fa-bar-chart btn-sm' ng-click='grid.appScope.lineChart(col)' style='margin: 0;padding-top:2px;padding-bottom: 2px'></button></div>";
                break;
            case "boolean":
                var filterName = 'filter'+featureName.replace(/[&-/\s]/gi, '');
                var columnFilterValue = $scope.columnsFilters[codedFeatureName];
                columnDef.filterHeaderTemplate="" +
                    "<div class='ui-grid-filter-container'>" +
                    "<button class='btn btn-primary btn-sm' ng-class='{\"btn btn-primary btn-sm \" : grid.appScope.isFilterOn(col) == 1, \"btn btn-flat btn-primary btn-sm\": grid.appScope.isFilterOn(col) != 1}' ng-click='grid.appScope.applyBooleanFilter(col, 1)' ><i class='fa fa-check-circle'></i></button>" +
                    "<button class='btn btn-danger btn-flat' ng-class='{\"btn btn-danger btn-sm \" : grid.appScope.isFilterOn(col) == 2, \"btn btn-flat btn-danger btn-sm\": grid.appScope.isFilterOn(col) != 2}' btn-xs' ng-click='grid.appScope.applyBooleanFilter(col, 2)' ><i class='fa fa-times-circle'></i></button>" +
                    "</div>";
                columnDef.filter.noTerm = true;
                columnDef.filter.condition = function (searchTerm,  cellValue) {
                    return $scope.filterBooleanColumns(cellValue, codedFeatureName);
                };
                break;

        }
        return columnDef;
    };

    $scope.lineChart = function(col) {
        $rootScope.$broadcast("lineChart", {col: col, pcmData: $scope.pcmData});
    };

    /**
     * Initialize the editor
     * @param pcm
     */
    $scope.initializeEditor = function(pcm, metadata, decode, loadFeatureGroups) {

        if(decode) {
            pcm = pcmApi.decodePCM(pcm); // Decode PCM from Base64
        }

        /* Convert PCM model to editor format */
        var features = pcmApi.getConcreteFeatures(pcm);

        $scope.pcmData = pcm.products.array.map(function(product) {
            var productData = {};
            features.map(function(feature) {
                var featureName = editorUtil.convertStringToEditorFormat(feature.name);
                if(!feature.name){
                    featureName = " ";
                }
                var cell = pcmApi.findCell(product, feature);
                productData.name = product.name; // FIXME : may conflict with feature name
                productData[featureName] = cell.content;
            });
            return productData;
        });

        // Return rawcontent
        $scope.pcmDataRaw = pcm.products.array.map(function(product) {
            var productDataRaw = {};
            features.map(function(feature) {
                var featureName =  editorUtil.convertStringToEditorFormat(feature.name);
                if(!feature.name){
                    featureName = " ";
                }
                var cell = pcmApi.findCell(product, feature);
                productDataRaw.name = product.name; // FIXME : may conflict with feature name
                if(cell.rawContent && cell.rawContent != "") {
                    productDataRaw[featureName] = cell.rawContent;
                }
                else {
                    productDataRaw[featureName] = cell.content;// TODO: replace content with rawcontent when implemented
                }
            });
            return productDataRaw;
        });
        $rootScope.$broadcast('setPcmName', $scope.pcm.name);

        createColumns(pcm, metadata, features, loadFeatureGroups);
        setOptions();

        $scope.setGridHeight();
        if(loadFeatureGroups) {
            $scope.gridOptions.superColDefs = sortFeaturesService.sortFeatureGroupByName($scope.gridOptions.superColDefs);
            $timeout(function() {$scope.loadFeatureGroups($scope.gridOptions.columnDefs, $scope.gridOptions.superColDefs);}, 0);
        }

    };

    function createColumns(pcm, metadata, features, loadFeatureGroups) {
        /* Define columns */
        var columnDefs = [];

        var colIndex = 0;
        var hasFeatureGroups = false;

        features.map(function(feature) {

            var featureName = feature.name;
            if(!feature.name){
                featureName = " ";
            }
            var featureGroupName = "emptyFeatureGroup";
            if(feature.parentGroup) {
                featureGroupName = feature.parentGroup.name;
                hasFeatureGroups = true;
            }
            var colDef = $scope.newColumnDef(featureName, featureGroupName, typeService.getType(featureName, $scope.pcmData));
            columnDefs.push(colDef);
            colIndex++;
        });

        if(hasFeatureGroups && loadFeatureGroups) {
            $scope.gridOptions.superColDefs = [];
            var emptyfeatureGroup = {
                name: 'emptyFeatureGroup',
                displayName: ' '
            };
            $scope.gridOptions.superColDefs.push(emptyfeatureGroup);
            pcm.features.array.forEach(function (featureGroup) {
                var isAFeatureNotAFeatureGroup = false;
                features.map(function(feature) {
                    if(featureGroup.name == feature.name) {
                        isAFeatureNotAFeatureGroup = true;
                    }
                });
                if(!isAFeatureNotAFeatureGroup) {
                    var featureName = featureGroup.name;

                    var newFeatureGroup = {
                        name: featureName,
                        displayName: featureName
                    };
                    $scope.gridOptions.superColDefs.splice(0, 0, newFeatureGroup);
                }
            });
        }


        if(metadata) {
            $scope.pcmData = editorUtil.sortProducts($scope.pcmData, metadata.productPositions);
            $scope.pcmDataRaw = editorUtil.sortRawProducts($scope.pcmDataRaw, $scope.pcmData);
            columnDefs = editorUtil.sortFeatures(columnDefs, metadata.featurePositions);
        }

        var toolsColumn = {
            name: ' ',
            cellTemplate: '<div class="buttonsCell" ng-show="grid.appScope.edit">' +
            '<button role="button" class="btn btn-flat btn-default" ng-click="grid.appScope.removeProduct(row)"><i class="fa fa-times"></i></button>'+
            '</div>',
            enableCellEdit: false,
            enableFiltering: false,
            enableColumnResizing: false,
            pinnedLeft:true,
            enableSorting: false,
            enableHiding: false,
            enableColumnMenu: false,
            allowCellFocus: false,
            enableColumnMoving: false
        };
        switch($scope.edit) {
            case true:
                toolsColumn.width = 30;
                break;
            case false:
                toolsColumn.width = 1;
                break;
        }

        /* Second column for the products */
        var productsColumn = {
            name: 'Product',
            field: "name",
            cellClass: function(grid, row, col, rowRenderIndex, colRenderIndex) {
                return 'productCell';
            },
            enableSorting: true,
            enableHiding: false,
            enableColumnMoving: false,
            enableCellEdit: $scope.edit,
            enableCellEditOnFocus: $scope.edit,
            pinnedLeft:true,
            allowCellFocus: true,
            minWidth: 150,
            width: 150,
            menuItems: [
                {
                    title: 'Unhide everything',
                    icon: 'fa fa-eye',
                    action: function($event) {
                        $scope.gridOptions.columnDefs.forEach(function(featureData) {
                            featureData.visible = true;
                        });
                        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
                    }
                }
            ]
        };

        /* Specific filter for products */
        productsColumn.filter = [];
        productsColumn.filter.term = '';
        productsColumn.filter.placeholder = 'Find';
        productsColumn.filterHeaderTemplate="" +
            "<div class='ui-grid-filter-container'>" +
            "   <input type='text' class='form-control floating-label' ng-change='grid.appScope.applyProductFilter()' ng-model='grid.appScope.productFilter' placeholder='Find'"+
            "</div>";
        columnDefs.splice(0, 0, toolsColumn);
        columnDefs.splice(1, 0, productsColumn);


        if($scope.gridOptions.superColDefs.length > 0) {
            $scope.gridOptions.columnDefs = sortFeaturesService.sortByFeatureGroup(columnDefs, $scope.gridOptions.superColDefs);
        }
        else {
            $scope.gridOptions.columnDefs = columnDefs;
        }



    }

    function setOptions() {
        if(editorUtil.GetUrlValue('enableEdit') == 'false'){
            $scope.enableEdit = false;
        }
        if(editorUtil.GetUrlValue('enableExport') == 'false'){
            $scope.enableExport = false;
        }
        if(editorUtil.GetUrlValue('enableTitle') == 'false'){
            $scope.enableTitle = false;
        }
        if(editorUtil.GetUrlValue('enableShare') == 'false'){
            $scope.enableShare = false;
        }
        if(editorUtil.GetUrlValue('deleteAfterLoaded') == 'true'){
            if (typeof id !== 'undefined') {
                $http.get("/api/remove/" + id);
            }
        }
    }



    /**
     * Get the visual representation of a raw data
     * @param cellValue
     * @returns {Array.<T>|string|Blob|ArrayBuffer|*}
     */
    function getVisualRepresentation(cellValue, index, colName, hashkey, oldValue, oldRawValue, newRawValue) {
        $http.post("/api/extract-content", {
            type: 'wikipedia',
            rawContent: cellValue,
            responseType: "text/plain",
            transformResponse: function(d, e) { // Needed to not interpret matrix as json (begin with '{|')
                return d;
            }
        }).success(function(data) {
            var commandParameters = [];
            $scope.pcmData[index][colName] = data;

           /* if (colName != "Product") {
                commandParameters = [hashkey, colName, oldValue, data, oldRawValue, newRawValue];
            }
            else {
                commandParameters = [hashkey, 'name', oldValue, data, oldRawValue, newRawValue];
            }
            $scope.newCommand('edit', commandParameters);*/
            $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        });

        return 'Loading value...';
    }


});

