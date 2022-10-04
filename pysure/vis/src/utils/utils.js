
export const apidomain = "";

export function doFetch(url, cb) {
    fetch(`${window.PUBLIC_URL}${url}`).then((data) => {
        // console.log(url)
        if(data.status !== 200 || !data.ok) {
            throw new Error(`server returned ${data.status}${data.ok ? " ok" : ""}`);
        }
        const ct = data.headers.get("content-type");
        return data.json();
        // if(ct && ct.includes("application/json")) {
        //   return data.json();
        // }
        // throw new TypeError("response not JSON encoded");
    }).then(cb);
} // doFetch

export function getParameterByKey(key) {
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get(key);
    console.log(myParam);
    return myParam;
}

export const column_order_by_feat_freq = (attrs, rules) => {
    let col_info = [],
        col_order = [];
    for (let i = 0; i < attrs.length; i++) {
        col_info.push({
            'idx': i,
            'freq': 0
        });
        col_order.push(i);
    }

    rules.forEach((d)=> {
        let rule = d['rules']
        rule.forEach((r) => {
            col_info[r['feature']].freq++;
        });
    })

    // sort columns by freq.
    col_info.sort((a, b) => (a.freq > b.freq) ? -1 : 1);
    col_info.forEach((d, i) => col_order[d.idx] = i);

    return col_order;
}

export function postData(url, data, cb) {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    if (cb !== undefined) {
        fetch(`${window.PUBLIC_URL}${url}`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(data)
        }).then((data) => {
            if(data.status !== 200 || !data.ok) {
                throw new Error(`server returned ${data.status}${data.ok ? " ok" : ""}`);
            }
            const ct = data.headers.get("content-type");
            return data.json();
        }).then((cb));
    } else {
        fetch(`${window.PUBLIC_URL}${url}`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(data)
        }).then((res) => {
            console.log(res);
        });
    }

}
