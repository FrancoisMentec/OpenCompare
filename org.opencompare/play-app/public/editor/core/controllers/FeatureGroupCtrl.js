/**
 * Created by hvallee on 6/19/15.
 * Updated by hvallee on 8/17/15
 */


/**
 * FeatureGroupCtrl.js
 * Managed feature groups
 */
pcmApp.controller("FeatureGroupCtrl", function($rootScope, $scope, $window, $http, $timeout, featureGroupService, editorUtil) {

    $scope.cols = {};


    $scope.isAFeature = function(col) {
        return col.name != ' ' && col.name != 'Product';
    };

    $scope.isAFeatureGroup = function(col) {console.log(col.name);
        return col.name != 'emptyFeatureGroup';
    };

    $scope.setCols = function() {
        var cols = $scope.gridOptions.columnDefs;
        for(var i = 2; i < cols.length; i ++) {
            $scope.cols[i-2] = {name: cols[i].name, isChecked: false};
        }
    };

    $scope.setRenameFeatureGroupModal = function(featureName) {
        featureGroupService.setCurrentFeatureGroup(featureName);
    };

    $scope.deleteUnusedFeatureGroups = function(){
        var index = 0;
        for(var col in $scope.gridOptions.superColDefs) {
            if($scope.gridOptions.superColDefs[index]) {
                if(editorUtil.getNumberOfFeaturesWithThisFeatureGroup($scope.gridOptions.columnDefs, $scope.gridOptions.superColDefs[index].name ) == 0) {

                    $scope.gridOptions.superColDefs.splice(index, 1);
                }
                index++;
            }

        }
    };

    $scope.loadFeatureGroups = function(cols, superCols) {
        var columnWidth = $scope.minWidth;
        var availableWidth = $(document).width() - 150 - 30 - 3;//Todo: not optimal for now, using minus product column and minus padding minus grid property
        if(availableWidth > ((cols.length-2) * $scope.minWidth)) {
            $timeout(function(){$rootScope.$broadcast('reloadFeatureGroup');}, 100);
        }
        else {
            for(var i = 0; i < superCols.length; i++) {
                var _colId = superCols[i].name;
                var _parentCol = jQuery('.ui-grid-header-cell[col-name="' + _colId + '"]');
                var numberOfColumnAffected = editorUtil.getNumberOfFeaturesWithThisFeatureGroup(cols, superCols[i].name);
                var _parentWidth = numberOfColumnAffected * columnWidth;
                _parentCol.css({
                    'min-width': _parentWidth + 'px',
                    'max-width': _parentWidth + 'px',
                    'text-align': "center"
                });
            }
        }
    };

    $scope.resizeFeatureGroup = function(cols, resizedCol, deltaChange) {

        var availableWidth = $(document).width() - 150 - 30 - 3;//Todo: not optimal for now, using minus product column and minus padding minus grid property
        if(availableWidth > ((cols.length-2) * $scope.minWidth)) {
            $timeout(function(){$rootScope.$broadcast('reloadFeatureGroup');}, 100);
        }
        else {
            var _parentCol = jQuery('.ui-grid-header-cell[col-name="' + resizedCol.superCol + '"]');
            var _parentWidth = _parentCol.outerWidth() + deltaChange;
            if (deltaChange < 0) {
                var numberOfColumnAffected = editorUtil.getNumberOfFeaturesWithThisFeatureGroup(cols, resizedCol.superCol);
                if (_parentWidth < (numberOfColumnAffected * resizedCol.minWidth)) {
                    _parentWidth = numberOfColumnAffected * resizedCol.minWidth;
                }
            }
            _parentCol.css({
                'min-width': _parentWidth + 'px',
                'max-width': _parentWidth + 'px',
                'text-align': "center"
            });
        }
    };

    $scope.adaptFeatureGroupsWidthsToHeaderRow = function(superCols) {
        var widthToSubstract = 30 / superCols.length;console.log(widthToSubstract);
        for(var i = 0; i < superCols.length; i++) {
            var _colId = superCols[i].name;
            if(_colId != 'emptyFeatureGroup') {
                var _parentCol = jQuery('.ui-grid-header-cell[col-name="' + _colId + '"]');
                console.log(_parentCol.outerWidth());
                var _parentWidth = _parentCol.outerWidth() - widthToSubstract;
                _parentCol.css({
                    'min-width': _parentWidth + 'px',
                    'max-width': _parentWidth + 'px',
                    'text-align': "center"
                });
            }
        }
    };

    $scope.getFeaturesWithThisFeatureGroup = function(featureGroup, features) {
        var featuresWithThisFeatureGroup = [];
        for(var i = 0; i < features.length; i++) {
            var currentFeature = features[i];
            if(currentFeature.superCol == featureGroup) {
                featuresWithThisFeatureGroup.push(currentFeature.name);
            }
        }
        return featuresWithThisFeatureGroup;
    };

    $scope.$watch(function(){
        return $window.innerWidth;
    }, function(value) {
        $rootScope.$broadcast('reloadFeatureGroup');
    });

});