import json
import pandas as pd
import numpy as np
from surrogate_rule import forest_info
from surrogate_rule import tree_node_info

def initialize(dataname, filter_threshold):
    file = f"public/data/{dataname}/test.json"
    with open(file, 'r') as json_input:
       data = json.load(json_input)

    rule_paras = filter_threshold

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
    self.rule_result = res