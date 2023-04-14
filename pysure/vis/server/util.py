import json
import pandas as pd
import numpy as np

def explore_rule(dataname, rule):
    file = f"public/data/{dataname}/test.json"
    with open(file, 'r') as json_input:
       data = json.load(json_input)
    df = pd.DataFrame(data=data['data'], columns=data['columns'])
    df['y_gt'] = data['y_gt']
    df['y_pred'] = data['y_pred']

    ## initialize
    res = []

    # update lattice node info
    cols = df.columns

    for cond in rule:
         # compare values with condition
        col = cols[cond['feature']]
        if (cond['sign'] == 'range'):
            df = df[(df[col] >= cond['threshold0']) & (df[col] < cond['threshold1'])]
        elif (cond['sign'] == '<'):
            df = df[df[col] < cond['threshold']]
        elif (cond['sign'] == '>'):
            df = df[df[col] > cond['threshold']]
        elif (cond['sign'] == '<='):
            df = df[df[col] <= cond['threshold']]
        elif (cond['sign'] == '>='):
            df = df[df[col] >= cond['threshold']]
        else:
            print("!!!!!! Error rule !!!!!!")

        res.append(update_cond_stat(df, cond))
    return res


def update_cond_stat(matched_data, cond):
    n_class = np.max([matched_data['y_pred'], matched_data['y_pred']]) + 1
    conf_matrix = np.zeros(shape=(n_class,2))
    for i in range(n_class):
        conf_matrix[i][0] = ((matched_data['y_pred'] == i) & (matched_data['y_pred']!=matched_data['y_gt'])).sum()
        conf_matrix[i][1] = ((matched_data['y_pred'] == i) & (matched_data['y_pred']==matched_data['y_gt'])).sum()
    return {
        'condition': cond,
        'support': matched_data.shape[0],
        'conf_matrix': conf_matrix.tolist()
    }
