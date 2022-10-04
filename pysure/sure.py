import os

try:
    import importlib.resources as pkg_resources
except ImportError:
    # Try backported to PY<37 `importlib_resources`.
    import importlib_resources as pkg_resources

from copyreg import constructor
from gc import callbacks
from notebookjs import execute_js
import numpy as np
import pandas as pd

from surrogate_rule import forest_info
from surrogate_rule import tree_node_info

default_rule_paras= {
            "support": 5,
            "fidelity": .85,
            "num_feat": 4,
            "num_bin": 3,
        }

class SuRE:

    def __init__(self, data, rule_paras=None, error_analysis=False) -> None:
        ## user-generated data
        self.data = data
        if (rule_paras):
            self.rule_paras = rule_paras
        else:
            self.rule_paras = default_rule_paras

        self.error_analysis = error_analysis

        ## loading rules
        self.generate_rules()

        ## loading vis lib
        self.vislib = None
        data_dir = os.path.join(os.path.dirname(__file__), "")
        data_path = os.path.join(data_dir, "vis/dist/sure.js")
        with open(data_path, "r") as f:
            self.vislib = f.read()

    def generate_rules(self):
        data = self.data
        rule_paras = self.rule_paras

        attrs = data['columns']

        surrogate_obj = tree_node_info.tree_node_info()
        y_pred = data['y_pred']
        y_gt = data['y_gt']
        df = pd.DataFrame(data=np.array(data['data']), columns = attrs)

        surrogate_obj.initialize(X=np.array(data['data']), y=np.array(data['y_gt']),
                                 y_pred=np.array(data['y_pred']), debug_class=-1,
                                 attrs=data['columns'], filter_threshold=rule_paras,
                                 n_cls=len(data['target_names']),
                                 num_bin=rule_paras['num_bin'],
                                 error_analysis = self.error_analysis,
                                 verbose=False
        ).train_surrogate_random_forest().tree_pruning()

        forest_obj = tree_node_info.forest()
        forest_obj.initialize(
            trees=surrogate_obj.tree_list, cate_X=surrogate_obj.cate_X,
            y=surrogate_obj.y, y_pred=surrogate_obj.y_pred, attrs=attrs,
            num_bin=rule_paras['num_bin'],
            real_percentiles=surrogate_obj.real_percentiles,
            real_min=surrogate_obj.real_min, real_max=surrogate_obj.real_max,
        ).construct_tree().extract_rules()

        forest = forest_info.Forest()

        forest.initialize(forest_obj.tree_node_dict, data['real_min'], data['real_max'],
                          surrogate_obj.percentile_info,
                          df, data['y_pred'], data['y_gt'],
                          forest_obj.rule_lists,
                          data['target_names'], 2,
                          error_analysis = self.error_analysis,
                         )
        forest.initialize_rule_match_table()
        forest.initilized_rule_overlapping()

        res = forest.find_the_min_set()
        lattice = forest.get_lattice_structure(res['rules'])

        res['lattice'] = lattice
        res['lattice_preIndex'] = forest.preIndex
        res['filter_threshold'] = rule_paras

        self.rule_result = res
        
    def visualize(self):
        ## setting callbacks
        callbacks = {
        }

        ## setting input data
        input_data = {key: self.rule_result[key] for key in self.rule_result.keys()}
        input_data['error_analysis'] = self.error_analysis
        for key in self.data:
            input_data[key] = self.data[key]

        # Plotting the Visualization
        execute_js(
            library_list=[self.vislib],
            main_function="sure.renderSuRE",
            data_dict=input_data,
            callbacks=callbacks )

    def get_preds_histogram( self, preds ):
        return calculate_preds_histograms(preds)

    def get_reliability_curve( self, event ):

        ## current model
        modelPredictions = self.predictions[event['currentmodel']]
        modelLabels = self.labels[event['currentmodel']]
        
        ## getting curve
        currentcurvedata, instancedata, confusionmatrix, preds, labels, allClassPreds, allClassLabels = get_reliability_curve( event, data=self.data, preds=modelPredictions, labels=modelLabels )
        
        ## saving instance data
        curve = ReliabilityCurve( 
            tableheader=instancedata['tableheader'], 
            tablebody=instancedata['tablebody'], 
            confusionMatrix=confusionmatrix, 
            preds=preds, 
            labels=labels,
            allClassPreds=allClassPreds,
            allClassLabels=allClassLabels)
        self.createdCurves.append(curve)

        ## getting curve
        return currentcurvedata

    def get_learned_curve( self, event ):

        selectedCurve = self.createdCurves[event['curveIndex']]
        learnedCurve = learned_reliability_diagram( selectedCurve.preds, selectedCurve.labels )

        return learnedCurve

    def get_curve_instance_data( self, event ):

        currentInstanceData = {
            'tableheader':  self.createdCurves[event['curveIndex']].tableheader,
            'tablebody': self.createdCurves[event['curveIndex']].tablebody,
            'tableaverages': get_table_average(self.createdCurves[event['curveIndex']].tablebody),
            'confusionmatrix': self.createdCurves[event['curveIndex']].confusionMatrix,
            'predshistogram': self.get_preds_histogram(self.createdCurves[event['curveIndex']].preds)
        }

        return currentInstanceData

    def filter_by_pred_range(self, event ):

        ## getting current curve
        currentCurve = self.createdCurves[0]

        ## setting conds
        conds = ( (currentCurve.preds >= event['start']) & (currentCurve.preds <= event['end']) )
        tablebody = np.array(currentCurve.tablebody)[conds]
        
        ## calculating filtered confusion matrix
        preds = currentCurve.allClassPreds[conds]
        labels = currentCurve.allClassLabels[conds]
        confusionMatrix = confusion(preds, labels)

        return {
            'tablebody': tablebody.tolist(),
            'tableheader': currentCurve.tableheader,
            'tableaverages': get_table_average( tablebody ),
            'confusionmatrix': confusionMatrix
        }

    def clear_curves(self, event):

        nCurves = len(self.createdCurves)
        self.createdCurves = []

        return {'ncurves':  nCurves}

