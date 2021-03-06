/*
 * Copyright 2018 datagear.tech. All Rights Reserved.
 */

/**
 * 图表支持库。
 * 全局变量名：window.chartSupport。
 * 
 * 加载时依赖：
 *   无
 * 
 * 运行时依赖:
 *   jquery.js
 *   echarts.js
 *   datagear-chartFactory.js
 */
(function(global)
{
	var chartSupport = (global.chartSupport || (global.chartSupport = {}));
	
	/**
	 * 获取/设置初始options。
	 */
	chartSupport.initOptions = function(chart, options)
	{
		if(options == undefined)
			return (chart.extValue("initOptions") || {});
		else
			chart.extValue("initOptions", options);
	};
	
	/**
	 * 合并指定索引的series元素对象，如果索引不对，则返回前一个合并。
	 */
	chartSupport.optionsSeries = function(options, index, mergeEle)
	{
		var seriesLen = (options && options.series ? (options.series.length || 0) : 0);
		
		if(!seriesLen)
			return {};
		
		index = (index < seriesLen ? index : seriesLen - 1);
		
		var ele = (options.series[index] || {});
		
		if(mergeEle == undefined)
			return ele;
		
		return $.extend({}, ele, mergeEle);
	};
	
	/**
	 * 获取/设置选项series模板
	 * 
	 * @param chart 图表对象
	 * @param options 要设置的options、要获取的series元素索引
	 */
	chartSupport.optionSeriesTemplate = function(chart, options)
	{
		//获取series数组
		if(options == undefined)
		{
			return chart.extValue("chartOptionSeriesTemplate");
		}
		//获取series元素
		else if(typeof(options) == "number")
		{
			var template = chart.extValue("chartOptionSeriesTemplate");
			var index = (template.length > options ? options : 0);
			
			return (template[index] ? template[index] : {});
		}
		//设置series数组
		else
			chart.extValue("chartOptionSeriesTemplate", (options.series || []));
	};
	
	/**
	 * 指定数据集属性数据是否字符串类型。
	 */
	chartSupport.isDataTypeString = function(dataSetProperty)
	{
		var dataType = (dataSetProperty ? (dataSetProperty.type || dataSetProperty) : "");
		return (dataType == "STRING");
	};
	
	/**
	 * 指定数据集属性数据是否数值类型。
	 */
	chartSupport.isDataTypeNumber = function(dataSetProperty)
	{
		var dataType = (dataSetProperty ? (dataSetProperty.type || dataSetProperty) : "");
		return (dataType == "INTEGER" || dataType == "DECIMAL");
	};
	
	/**
	 * 为源数组追加不重复的元素，返回追加索引或重复元素索引。
	 * 
	 * @param sourceArray
	 * @param append 追加元素，可以是基本类型、对象类型
	 * @param distinctPropertyName 当是对象类型时，用于指定判断重复的属性名
	 */
	chartSupport.appendDistinct = function(sourceArray, append, distinctPropertyName)
	{
		for(var i=0; i<sourceArray.length; i++)
		{
			var sv = (distinctPropertyName != undefined ? sourceArray[i][distinctPropertyName] : sourceArray[i]);
			var av = (distinctPropertyName != undefined ? append[distinctPropertyName] : append);
			
			if(sv == av)
				return i;
		}
		
		sourceArray.push(append);
		
		return (sourceArray.length - 1);
	};
	
	//折线图
	
	chartSupport.lineRender = function(chart, coordSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
		var vps = chart.dataSetPropertiesOfSign(chartDataSet, valueSign);
		var stack = (options && options.stack);//是否堆叠
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "axis"
			},
			legend:
			{
				data: []
			},
			xAxis: {
				name: chart.dataSetPropertyLabel(cp),
				nameGap: 5,
				type: (chartSupport.isDataTypeNumber(cp) ? "value" : "category"),
				boundaryGap: false
			},
			yAxis: {
				name: (vps.length == 1 ? chart.dataSetPropertyLabel(vps[0]) : ""),
				nameGap: 5,
				type: "value"
			},
			series: [{
				name: "",
				type: "line",
				data: []
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.lineUpdate = function(chart, results, coordSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		var stack = (initOptions && initOptions.stack);//是否堆叠
		
		var legendData = [];
		var series = [];
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var vps = chart.dataSetPropertiesOfSign(chartDataSet, valueSign);
			
			for(var j=0; j<vps.length; j++)
			{
				var legendName = dataSetName;
				if(chartDataSets.length > 1 && vps.length > 1)
					legendName = dataSetName +"-" + chart.dataSetPropertyLabel(vps[j]);
				else if(vps.length > 1)
					legendName = chart.dataSetPropertyLabel(vps[j]);
				
				var data = chart.resultRowArrays(result, [cp, vps[j]]);
				var mySeries = chartSupport.optionsSeries(initOptions, i*vps.length+j, {name: legendName, data: data});
				
				//折线图按数据集分组展示没有效果，所以都使用同一个堆叠
				if(stack)
					mySeries.stack = "stack";
				
				legendData.push(legendName);
				series.push(mySeries);
			}
		}
		
		var options = { legend: {data: legendData}, series: series };
		chart.echartsOptions(options);
	};
	
	//柱状图
	
	chartSupport.barRender = function(chart, coordSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
		var vps = chart.dataSetPropertiesOfSign(chartDataSet, valueSign);
		var stack = (options && options.stack);//是否堆叠
		var horizontal = (options && options.horizontal);//是否横向
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			legend:
			{
				data: []
			},
			xAxis: {
				name: chart.dataSetPropertyLabel(cp),
				nameGap: 5,
				type: "category",
				boundaryGap: true
			},
			yAxis: {
				name: (vps.length == 1 ? chart.dataSetPropertyLabel(vps[0]) : ""),
				nameGap: 5,
				type: "value"
			},
			series: [{
				name: "",
				type: "bar",
				label: { show: stack },
				data: []
			}]
		},
		options));
		
		if(horizontal)
		{
			var xAxisTmp = options.xAxis;
			options.xAxis = options.yAxis;
			options.yAxis = xAxisTmp;
		}
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.barUpdate = function(chart, results, coordSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		var stack = (initOptions && initOptions.stack);//是否堆叠
		var horizontal = (initOptions && initOptions.horizontal);//是否横向
		//是否按数据集分组堆叠
		var stackGroup = (!initOptions || initOptions.stackGroup == undefined ? true : initOptions.stackGroup);
		
		var legendData = [];
		var series = [];
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var vps = chart.dataSetPropertiesOfSign(chartDataSet, valueSign);
			
			for(var j=0; j<vps.length; j++)
			{
				var legendName = dataSetName;
				if(chartDataSets.length > 1 && vps.length > 1)
					legendName = dataSetName +"-" + chart.dataSetPropertyLabel(vps[j]);
				else if(vps.length > 1)
					legendName = chart.dataSetPropertyLabel(vps[j]);
				
				var data = chart.resultRowArrays(result, (horizontal ? [vps[j], cp] : [cp, vps[j]]));
				var mySeries = chartSupport.optionsSeries(initOptions, i*vps.length+j, {name: legendName, data: data});
				
				if(stack)
					mySeries.stack = (stackGroup ? "stack-"+i : "stack");
				
				legendData.push(legendName);
				series.push(mySeries);
			}
		}
		
		var options = { legend: {data: legendData}, series: series };
		chart.echartsOptions(options);
	};
	
	//横向柱状图
	
	chartSupport.barHorizontalRender = function(chart, coordSign, valueSign, options)
	{
		options = (options || {});
		options.horizontal = true;
		
		chartSupport.barRender(chart, coordSign, valueSign, options);
	};
	
	chartSupport.barHorizontalUpdate = function(chart, results, coordSign, valueSign)
	{
		chartSupport.barUpdate(chart, results, coordSign, valueSign);
	};
	
	//饼图
	
	chartSupport.pieRender = function(chart, coordSign, valueSign, options)
	{
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item",
				formatter: "{a} <br/>{b}: {c} ({d}%)"
			},
			legend:
			{
				data: []
			},
			series:
			[
				{
					name: chart.nameNonNull(),
					type: "pie",
					radius: "55%",
					center: ["50%", "60%"],
					data: []
				}
			]
		},
		options));

		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.pieUpdate = function(chart, results, coordSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();

		var legendData = [];
		var seriesName = "";
		var seriesData = [];
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);

			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var cpv = chart.resultColumnArrays(result, cp);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			var nvv = chart.resultNameValueObjects(result, cp, vp);
			
			legendData = legendData.concat(cpv);
			if(i == 0)
				seriesName = dataSetName;
			seriesData = seriesData.concat(nvv);
		}
		
		var series = [ chartSupport.optionsSeries(initOptions, 0, {name: seriesName, data: seriesData}) ];
		
		var options = { legend: { data: legendData }, series: series };
		chart.echartsOptions(options);
	};
	
	//仪表盘
	
	chartSupport.gaugeRender = function(chart, valueSign, minSign, maxSign, options)
	{
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				formatter: "{a} <br/>{b} : {c}"
			},
			series:
			[
				{
					name: "",
					type: "gauge",
					detail: {formatter: "{value}"},
					data: [{value: 0, name: ''}]
				}
			]
		},
		options));
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.gaugeUpdate = function(chart, results, valueSign, minSign, maxSign)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var result = chart.resultFirst(results);
		
		var seriesName = chart.dataSetName(chartDataSet);
		
		var minp = chart.dataSetPropertyOfSign(chartDataSet, minSign);
		var maxp = chart.dataSetPropertyOfSign(chartDataSet, maxSign);
		var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
		
		var min = (chart.resultCell(result, minp) || 0);
		var max = (chart.resultCell(result, maxp) || 100);
		var value = (chart.resultCell(result, vp) || 0);
		
		var options = { series : 
			[
				{
					name: seriesName, min: min, max: max,
					data: [{ value: value, name: chart.dataSetPropertyLabel(vp) }]
				}
			]};
		
		chart.echartsOptions(options);
	};
	
	//散点图
	
	chartSupport.scatterRender = function(chart, coordSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
		var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			legend:
			{
				data: []
			},
			xAxis: {
				name: chart.dataSetPropertyLabel(cp),
				nameGap: 5,
				type: (chartSupport.isDataTypeNumber(cp) ? "value" : "category"),
				boundaryGap: !chartSupport.isDataTypeNumber(cp)
			},
			yAxis: {
				name: chart.dataSetPropertyLabel(vp),
				nameGap: 5,
				type: "value"
			},
			//最大数据标记像素数
			symbolSizeMax: undefined,
			//最小数据标记像素数
			symbolSizeMin: undefined,
			series: [{
				name: "",
				type: "scatter",
				data: []
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.scatterUpdate = function(chart, results, coordSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var legendData = [];
		var series = [];
		
		var min = undefined, max = undefined;
		var symbolSizeMax = chartSupport.scatterSymbolSizeMax(chart, initOptions);
		var symbolSizeMin = chartSupport.scatterSymbolSizeMin(chart, initOptions, symbolSizeMax);
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var vps = chart.dataSetPropertiesOfSign(chartDataSet, valueSign);
			
			for(var j=0; j<vps.length; j++)
			{
				var legendName = dataSetName;
				if(chartDataSets.length > 1 && vps.length > 1)
					legendName = dataSetName +"-" + chart.dataSetPropertyLabel(vps[j]);
				else if(vps.length > 1)
					legendName = chart.dataSetPropertyLabel(vps[j]);
				
				var data = chart.resultRowArrays(result, [cp, vps[j]]);
				
				for(var k=0; k<data.length; k++)
				{
					min = (min == undefined ? data[k][1] : Math.min(min, data[k][1]));
					max = (max == undefined ? data[k][1] : Math.max(max, data[k][1]));
				}
				
				var mySeries = chartSupport.optionsSeries(initOptions, i*vps.length+j, { name: legendName, data: data });
				
				legendData.push(legendName);
				series.push(mySeries);
			}
		}
		
		if(min != null && max != null && max <= min)
			max = min + 1;
		
		for(var i=0; i<series.length; i++)
		{
			series[i].symbolSize = function(value)
			{
				return chartSupport.scatterEvalSymbolSize(value[1], min, max, symbolSizeMax, symbolSizeMin);
			};
		}
		
		var options = { legend: {data: legendData}, series: series };
		chart.echartsOptions(options);
	};
	
	//坐标散点图
	
	chartSupport.scatterCoordRender = function(chart, coordSign, coord2Sign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
		var c2p = chart.dataSetPropertyOfSign(chartDataSet, coord2Sign);
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			legend:
			{
				data: []
			},
			xAxis: {
				name: chart.dataSetPropertyLabel(cp),
				nameGap: 5,
				type: (chartSupport.isDataTypeNumber(cp) ? "value" : "category"),
				boundaryGap: !chartSupport.isDataTypeNumber(cp)
			},
			yAxis: {
				name: chart.dataSetPropertyLabel(c2p),
				nameGap: 5,
				type: "value"
			},
			//最大数据标记像素数
			symbolSizeMax: undefined,
			//最小数据标记像素数
			symbolSizeMin: undefined,
			series: [{
				name: "",
				type: "scatter",
				data: []
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.scatterCoordUpdate = function(chart, results, coordSign, coord2Sign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var legendData = [];
		var series = [];
		
		var min = undefined, max = undefined;
		var symbolSizeMax = chartSupport.scatterSymbolSizeMax(chart, initOptions);
		var symbolSizeMin = chartSupport.scatterSymbolSizeMin(chart, initOptions, symbolSizeMax);
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var c2p = chart.dataSetPropertyOfSign(chartDataSet, coord2Sign);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			
			var data = (vp ? chart.resultRowArrays(result, [cp, c2p, vp]) : chart.resultRowArrays(result, [cp, c2p]));
			
			if(vp)
			{
				for(var j=0; j<data.length; j++)
				{
					min = (min == undefined ? data[j][2] : Math.min(min, data[j][2]));
					max = (max == undefined ? data[j][2] : Math.max(max, data[j][2]));
				}
			}
			
			var mySeries = chartSupport.optionsSeries(initOptions, i, { name: dataSetName, data: data });
			legendData.push(dataSetName);
			series.push(mySeries);
		}
		
		if(min != null && max != null && max <= min)
			max = min + 1;
		
		for(var i=0; i<series.length; i++)
		{
			series[i].symbolSize = function(value)
			{
				if(value == null || value.length < 3)
					return symbolSizeMin;
				
				return chartSupport.scatterEvalSymbolSize(value[2], min, max, symbolSizeMax, symbolSizeMin);
			};
		}
		
		var options = { legend: {data: legendData}, series: series };
		chart.echartsOptions(options);
	};
	
	/**
	 * 获取散点图最大数据标记像素数
	 * @param chart
	 * @param options
	 * @param 可选，自动获取的比率
	 */
	chartSupport.scatterSymbolSizeMax = function(chart, options, ratio)
	{
		var symbolSizeMax = (options ? options.symbolSizeMax : undefined);
		ratio = (ratio == undefined ? 0.1 : ratio);
		
		//根据图表元素尺寸自动计算
		if(!symbolSizeMax)
		{
			var chartEle = chart.elementJquery();
			symbolSizeMax =parseInt(Math.min(chartEle.width(), chartEle.height())*ratio);
		}
		
		return symbolSizeMax;
	};

	/**
	 * 获取散点图最小数据标记像素数
	 * @param chart
	 * @param options
	 * @param symbolSizeMax
	 */
	chartSupport.scatterSymbolSizeMin = function(chart, options, symbolSizeMax, ratio)
	{
		var symbolSizeMin = (options ? options.symbolSizeMin : undefined);
		ratio = (ratio == undefined ? 0.125 : ratio);
		
		if(!symbolSizeMin)
		{
			symbolSizeMin = parseInt(symbolSizeMax * ratio);
			if(symbolSizeMin < 6)
				symbolSizeMin = 6;
		}
		
		return symbolSizeMin;
	};
	
	//计算散点大小
	chartSupport.scatterEvalSymbolSize = function(value, minValue, maxValue, symbolSizeMax, symbolSizeMin)
	{
		if(symbolSizeMin == undefined)
			symbolSizeMin = 4;
		
		var size = parseInt((value-minValue)/(maxValue-minValue)*symbolSizeMax);
		return (size < symbolSizeMin ? symbolSizeMin : size);
	};
	
	//雷达图
	
	chartSupport.radarRender = function(chart, nameSign, coordSign, valueSign, maxSign, options)
	{
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			legend:
			{
				data: []
			},
			radar:
			{
				center: ["50%", "60%"],
				radius: "70%",
				nameGap: 6,
				indicator: []
			},
			series: [{
				name: "",
				type: "radar",
				data: []
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.radarUpdate = function(chart, results, nameSign, coordSign, valueSign, maxSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var legendData = [];
		var indicatorData = [];
		var series = [];
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			var np = chart.dataSetPropertyOfSign(chartDataSet, nameSign);
			var nv = chart.resultColumnArrays(result, np);
			legendData = legendData.concat(nv);
			
			if(i == 0)
			{
				var dnp = chart.dataSetPropertiesOfSign(chartDataSet, coordSign);
				var dnpv = chart.resultRowArrays(result, dnp, 0, 1);
				dnpv = (dnpv.length > 0 ? dnpv[0] : []);
				var dmp = chart.dataSetPropertiesOfSign(chartDataSet, maxSign);
				var dmpv = chart.resultRowArrays(result, dmp, 0, 1);
				dmpv = (dmpv.length > 0 ? dmpv[0] : []);
				
				var indicatorLen = Math.min(dnp.length, dmp.length);
				
				for(var j=0; j<indicatorLen; j++)
				{
					var indicator = {name: dnpv[j], max: dmpv[j]};
					indicatorData[j] = indicator;
				}
			}
			
			var dvp = chart.dataSetPropertiesOfSign(chartDataSet, valueSign);
			var dvpv = chart.resultRowArrays(result, dvp);
			
			for(var j=0; j<nv.length; j++)
			{
				series.push(chartSupport.optionsSeries(initOptions, i*nv.length+j, {data: [{name: nv[j], value: dvpv[j]}]}));
			}
		}
		
		var options = { legend: {data: legendData}, radar: {indicator: indicatorData}, series: series };
		chart.echartsOptions(options);
	};
	
	//漏斗图
	
	chartSupport.funnelRender = function(chart, coordSign, valueSign, options)
	{
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
		    tooltip:
		    {
		        trigger: "item",
		        formatter: "{a} <br/>{b} : {c}"
		    },
			legend:
			{
				data: []
			},
			series:
			[
				{
		            name: "",
		            type: "funnel",
		            left: "10%",
		            top: 80,
		            bottom: 60,
		            width: "80%",
		            min: 0,
		            max: 100,
		            minSize: "0%",
		            maxSize: "100%",
		            sort: "descending",
		            gap: 2,
		            data: []
		        }
			]
		},
		options));

		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.funnelUpdate = function(chart, results, coordSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();

		var legendData = [];
		var seriesName = "";
		var seriesData = [];
		var min = 0;
		var max = 100;

		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);

			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var cpv = chart.resultColumnArrays(result, cp);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			var nvv = chart.resultNameValueObjects(result, cp, vp);
			
			legendData = legendData.concat(cpv);
			if(i == 0)
				seriesName = dataSetName;
			seriesData = seriesData.concat(nvv);
		}
		
		for(var i=0; i<seriesData.length; i++)
		{
			var nvv = seriesData[i];
			var v = (nvv ? (nvv.value || 0) : 0);
			
			if(v < min)
				min = v;
			else if(v > max)
				max = v;
		}
		
		var series = [ chartSupport.optionsSeries(initOptions, 0, {name: seriesName, min: min, max: max, data: seriesData }) ];
		
		var options = { legend: { data: legendData }, series: series };
		chart.echartsOptions(options);
	};
	
	//地图
	
	chartSupport.mapInitChart = function(chart, options)
	{
		var map = (options.geo ? options.geo.map : undefined);
		if(map == undefined)
			map = (options.series && options.series.length > 0 ? options.series[0].map : undefined);
		
		if(!map)
			throw new Error("[map] option must be set");
		
		chart.extValue("mapPresetMap", map);
		chart.map(map);
		chartSupport.initOptions(chart, options);
		
		if(chart.echartsMapRegistered(map))
		{
			chart.echartsInit(options, false);
			chart.statusPreUpdate(true);
		}
		else
		{
			chart.echartsMapLoad(map, function()
			{
				chart.echartsInit(options, false);
				chart.statusPreUpdate(true);
			});
		}
	};
	
	chartSupport.mapUpdateChart = function(chart, initOptions, updateOptions)
	{
		var map = undefined;
		//地图作为坐标系，而非图表series
		var isGeo = (initOptions.geo);
		
		if(isGeo)
			map = (updateOptions.geo ? updateOptions.geo.map : undefined);
		else
			map = (updateOptions.series && updateOptions.series.length > 0 ? updateOptions.series[0].map : undefined);
		
		if(!map)
		{
			var eleMap = chart.map();
			if(eleMap && eleMap != chart.extValue("mapPresetMap"))
			{
				if(isGeo)
					updateOptions.geo.map = eleMap;
				else
					updateOptions.series[0].map = eleMap;
				
				map = eleMap;
			}
		}
		
		if(map)
		{
			chart.extValue("mapPresetMap", map);
			chart.map(map);
		}
		
		if(!map || chart.echartsMapRegistered(map))
		{
			chart.echartsOptions(updateOptions, false);
			chart.statusUpdated(true);
		}
		else
		{
			chart.echartsMapLoad(map, function()
			{
				chart.echartsOptions(updateOptions, false);
				chart.statusUpdated(true);
			});
		}
	};
	
	chartSupport.mapRender = function(chart, coordSign, valueSign, options)
	{
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item",
				formatter: "{b}<br/>{c}"
			},
			visualMap:
			{
				min: 0,
				max: 100,
				text: ["高", "低"],
				realtime: true,
				calculable: true
			},
			series:
			[
				{
					name: "",
					type: "map",
					map: (chart.map() || "china"),
					label: {
						show: true
					},
					data: []
				}
			]
		},
		options));
		
		chartSupport.mapInitChart(chart, options);
	};
	
	chartSupport.mapUpdate = function(chart, results, coordSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var min = Number.MAX_VALUE;
		var max = Number.MIN_VALUE;
		var seriesName = "";
		var seriesData = [];

		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);

			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			var nvv = chart.resultNameValueObjects(result, cp, vp);
			
			if(i == 0)
				seriesName = dataSetName;
			seriesData = seriesData.concat(nvv);
			
			if(nvv && nvv.length)
			{
				for(var j=0; j<nvv.length; j++)
				{
					var val = nvv[j].value;
					if(val < min)
						min = val;
					else if(val > max)
						max = val;
				}
			}
		}
		
		var options = { visualMap: {min, min, max: max}, series: [ {name: seriesName, data: seriesData } ] };
		options = chart.optionsModified(options);
		
		chartSupport.mapUpdateChart(chart, initOptions, options);
	};
	
	//散点值地图
	
	chartSupport.mapScatterRender = function(chart, coordSign, coordLongitudeSign, coordLatitudeSign, valueSign, options)
	{
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item",
				formatter: function (params)
				{
					return params.name + "<br/>" + params.value[2];
				}
			},
			geo:
			{
				roam: true,
				map: (chart.map() || "china")
			},
			//最大数据标记像素数
			symbolSizeMax: undefined,
			//最小数据标记像素数
			symbolSizeMin: undefined,
			series:
			[
				{
					name: "",
					type: "scatter",
					coordinateSystem: "geo",
					data: []
				}
			]
		},
		options));
		
		chartSupport.mapInitChart(chart, options);
	};
	
	chartSupport.mapScatterUpdate = function(chart, results, coordSign, coordLongitudeSign, coordLatitudeSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var legendData = [];
		var series = [];
		
		var min = undefined, max = undefined;
		var symbolSizeMax = chartSupport.scatterSymbolSizeMax(chart, initOptions);
		var symbolSizeMin = chartSupport.scatterSymbolSizeMin(chart, initOptions, symbolSizeMax);
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			var valueProperties =
			[
				chart.dataSetPropertyOfSign(chartDataSet, coordLongitudeSign),
				chart.dataSetPropertyOfSign(chartDataSet, coordLatitudeSign),
				chart.dataSetPropertyOfSign(chartDataSet, valueSign)
			];
			var data = chart.resultNameValueObjects(result, chart.dataSetPropertyOfSign(chartDataSet, coordSign), valueProperties);
			
			for(var j=0; j<data.length; j++)
			{
				var dv = data[j].value;
				
				min = (min == undefined ? dv[2] : Math.min(min, dv[2]));
				max = (max == undefined ? dv[2] : Math.max(max, dv[2]));
			}
			
			legendData[i] = dataSetName;
			series[i] = chartSupport.optionsSeries(initOptions, i, { name: dataSetName, data: data });
		}

		if(min != null && max != null && max <= min)
			max = min + 1;

		for(var i=0; i<series.length; i++)
		{
			series[i].symbolSize = function(value)
			{
				if(value && value.length > 2)
					value = value[2];
				
				if(value == null)
					return symbolSizeMin;
				
				return chartSupport.scatterEvalSymbolSize(value, min, max, symbolSizeMax, symbolSizeMin);
			};
		}

		var options = { legend: {data: legendData}, series: series };
		options = chart.optionsModified(options);
		
		chartSupport.mapUpdateChart(chart, initOptions, options);
	};
	
	//关系地图
	
	chartSupport.mapGraphRender = function(chart, sourceIdSign, sourceLongitudeSign, sourceLatitudeSign, sourceNameSign, sourceCategorySign, sourceValueSign,
			targetIdSign, targetLongitudeSign, targetLatitudeSign, targetNameSign, targetCategorySign, targetValueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			geo:
			{
				roam: true,
				map: (chart.map() || "china")
			},
			//最大数据标记像素数
			symbolSizeMax: undefined,
			//最大数据标记像素数
			symbolSizeMin: undefined,
			series: [{
				name: "",
				type: "graph",
		        layout: "none",
		        coordinateSystem: "geo",
				data: [],
				links: [],
				legendHoverLink: true,
                focusNodeAdjacency: true,
				label: { position: "right" }
			}]
		},
		options));
		
		chartSupport.mapInitChart(chart, options);
	};

	chartSupport.mapGraphUpdate = function(chart, results, sourceIdSign, sourceLongitudeSign, sourceLatitudeSign, sourceNameSign, sourceCategorySign, sourceValueSign,
			targetIdSign, targetLongitudeSign, targetLatitudeSign, targetNameSign, targetCategorySign, targetValueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var legendData = [];
		var seriesName = "";
		var categories = [];
		var seriesData = [];
		var seriesLinks = [];
		
		var min = undefined, max = undefined;
		var symbolSizeMax = chartSupport.scatterSymbolSizeMax(chart, initOptions);
		var symbolSizeMin = chartSupport.scatterSymbolSizeMin(chart, initOptions, symbolSizeMax);
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var result = chart.resultAt(results, i);
			
			if(i == 0)
				seriesName = chart.dataSetName(chartDataSet);
			
			var sip = chart.dataSetPropertyOfSign(chartDataSet, sourceIdSign);
			var slop = chart.dataSetPropertyOfSign(chartDataSet, sourceLongitudeSign);
			var slap = chart.dataSetPropertyOfSign(chartDataSet, sourceLatitudeSign);
			var snp = chart.dataSetPropertyOfSign(chartDataSet, sourceNameSign);
			var scp = chart.dataSetPropertyOfSign(chartDataSet, sourceCategorySign);
			var svp = chart.dataSetPropertyOfSign(chartDataSet, sourceValueSign);
			var tip = chart.dataSetPropertyOfSign(chartDataSet, targetIdSign);
			var tlop = chart.dataSetPropertyOfSign(chartDataSet, targetLongitudeSign);
			var tlap = chart.dataSetPropertyOfSign(chartDataSet, targetLatitudeSign);
			var tnp = chart.dataSetPropertyOfSign(chartDataSet, targetNameSign);
			var tcp = chart.dataSetPropertyOfSign(chartDataSet, targetCategorySign);
			var tvp = chart.dataSetPropertyOfSign(chartDataSet, targetValueSign);
			
			var data = chart.resultDatas(result);
			
			for(var i=0; i<data.length; i++)
			{
				var sd = { name: chart.resultRowCell(data[i], snp), value: [ chart.resultRowCell(data[i], slop), chart.resultRowCell(data[i], slap) ] };
				var td = { name: chart.resultRowCell(data[i], tnp), value: [ chart.resultRowCell(data[i], tlop), chart.resultRowCell(data[i], tlap) ] };
				
				if(sip)
					sd.id = chart.resultRowCell(data[i], sip);
				
				if(scp)
				{
					var category = chart.resultRowCell(data[i], scp);
					if(category)
					{
						sd.category = chartSupport.appendDistinct(categories, {name: category}, "name");
						chartSupport.appendDistinct(legendData, category);
					}
				}
				
				if(svp)
				{
					var sv = chart.resultRowCell(data[i], svp);
					sd.value.push(sv);
					
					min = (min == undefined ? sv : Math.min(min, sv));
					max = (max == undefined ? sv : Math.max(max, sv));
				}
				
				if(tip)
					td.id = chart.resultRowCell(data[i], tip);
				
				if(tcp)
				{
					var category = chart.resultRowCell(data[i], tcp);
					if(category)
					{
						td.category = chartSupport.appendDistinct(categories, {name: category}, "name");
						chartSupport.appendDistinct(legendData, category);
					}
				}
				
				if(tvp)
				{
					var tv = chart.resultRowCell(data[i], tvp);
					td.value.push(tv);
					
					min = (min == undefined ? tv : Math.min(min, tv));
					max = (max == undefined ? tv : Math.max(max, tv));
				}
				
				var sidx = chartSupport.appendDistinct(seriesData, sd, (sip ? "id" : "name"));
				var tidx = chartSupport.appendDistinct(seriesData, td, (tip ? "id" : "name"));

				//如果使用id值表示关系，对于数值型id，echarts会误当做数据索引，所以这里直接使用数据索引
				var link = {};
				link.source = sidx;
				link.target = tidx;
				
				seriesLinks.push(link);
			}
		}
		
		if(min != null && max != null && max <= min)
			max = min + 1;
		
		var series = [ chartSupport.optionsSeries(initOptions, 0, { name: seriesName, categories: categories, data: seriesData, links: seriesLinks }) ];
		
		//自动计算散点大小
		if(series[0].symbolSize == null)
		{
			series[0].symbolSize = function(value, params)
			{
				if(value && value.length > 2)
					value = value[2];
				
				if(value == null)
					return symbolSizeMin;
				
				return chartSupport.scatterEvalSymbolSize(value, min, max, symbolSizeMax, symbolSizeMin);
			};
		}
		
		var options = { legend: {data: legendData}, series: series };
		options = chart.optionsModified(options);
		
		chartSupport.mapUpdateChart(chart, initOptions, options);
	};
	
	//K线图
	
	chartSupport.candlestickRender = function(chart, coordSign, openSign, closeSign, minSign, maxSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			legend:
			{
				data: []
			},
			xAxis: {
				name: chart.dataSetPropertyLabel(cp),
				nameGap: 5,
				type: (chartSupport.isDataTypeNumber(cp) ? "value" : "category"),
				boundaryGap: true,
				splitLine: {show:false},
				data: []
			},
			yAxis: {
				name: "",
				nameGap: 5,
				type: "value"
			},
			series: [{
				name: "",
				type: "k",
				data: []
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.candlestickUpdate = function(chart, results, coordSign, openSign, closeSign, minSign, maxSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var legendData = [];
		var xAxisData = [];
		var series = [];
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			if(i == 0)
			{
				var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
				xAxisData = chart.resultColumnArrays(result, cp);
			}
			
			var data = chart.resultRowArrays(result,
					[
						chart.dataSetPropertyOfSign(chartDataSet, openSign),
						chart.dataSetPropertyOfSign(chartDataSet, closeSign),
						chart.dataSetPropertyOfSign(chartDataSet, minSign),
						chart.dataSetPropertyOfSign(chartDataSet, maxSign)
					]);
			
			series.push(chartSupport.optionsSeries(initOptions, i, {name: dataSetName, data: data}));
		}
		
		var options = { legend: {data: legendData}, xAxis : { data : xAxisData }, series: series };
		chart.echartsOptions(options);
	};
	
	//热力图
	
	chartSupport.heatmapRender = function(chart, coordSign, coord2Sign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
		var c2p = chart.dataSetPropertyOfSign(chartDataSet, coord2Sign);
		
		var chartEle = chart.elementJquery();
		var vmItemWidth = parseInt(chartEle.height()/20);
			
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			grid: { bottom: vmItemWidth + 20 },
			legend:
			{
				data: []
			},
			xAxis: {
				name: chart.dataSetPropertyLabel(cp),
				nameGap: 5,
				type: "category",
				data: []
			},
			yAxis: {
				name: chart.dataSetPropertyLabel(c2p),
				nameGap: 5,
				type: "category",
				data: []
			},
			visualMap:
			{
				min: 0,
				max: 100,
				text: ["高", "低"],
				realtime: true,
				calculable: true,
				orient: "horizontal",
		        left: "center",
		        itemWidth: vmItemWidth,
		        itemHeight: parseInt(chartEle.width()/8),
		        bottom: 0
			},
			series: [{
				name: "",
				type: "heatmap",
				label: {show:true},
				emphasis: { itemStyle: { shadowBlur: 5 } },
				data: []
			}]
		},
		options));

		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.heatmapUpdate = function(chart, results, coordSign, coord2Sign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var xAxisData = [];
		var yAxisData = [];
		var seriesName = "";
		var seriesData = [];
		var min = undefined, max=undefined;
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			seriesName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			var cp = chart.dataSetPropertyOfSign(chartDataSet, coordSign);
			var c2p = chart.dataSetPropertyOfSign(chartDataSet, coord2Sign);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			
			var data = chart.resultRowArrays(result, [
								chart.dataSetPropertyOfSign(chartDataSet, coordSign),
								chart.dataSetPropertyOfSign(chartDataSet, coord2Sign),
								chart.dataSetPropertyOfSign(chartDataSet, valueSign)
							]);
			
			for(var i=0; i<data.length; i++)
			{
				chartSupport.appendDistinct(xAxisData, data[i][0]);
				chartSupport.appendDistinct(yAxisData, data[i][1]);
				
				min = (min == undefined ? data[i][2] : Math.min(min, data[i][2]));
				max = (max == undefined ? data[i][2] : Math.max(max, data[i][2]));
			}
			
			seriesData = seriesData.concat(data);
		}
		
		if(min == undefined)
			min = 0;
		if(max == undefined)
			max = 1;
		if(max < min)
			max = min + 1;
		
		var series = [ chartSupport.optionsSeries(initOptions, 0, { name: seriesName, data: seriesData }) ];
		
		var options = { xAxis: { data: xAxisData }, yAxis: { data: yAxisData }, visualMap: {min: min, max: max}, series: series };
		chart.echartsOptions(options);
	};
	
	//树图
	chartSupport.treeRender = function(chart, idSign, nameSign, parentSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			series: [{
				name: "",
				data: [],
				type: "tree",
				label:
				{
					position: "left",
					verticalAlign: "middle",
					align: "right"
                },
                leaves:
                {
                	label:
                	{
                		position: "right",
                		verticalAlign: "middle",
                		align: "left"
                	}
                },
                left: "16%",
                right: "16%",
                top: "12%",
                bottom: "12%",
                orient: "LR",
                expandAndCollapse: true
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.treeUpdate = function(chart, results, idSign, nameSign, parentSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		
		var mySeries = chartSupport.buildTreeNodeSeries(chart, results, idSign, nameSign, parentSign, valueSign);
		var series = [ chartSupport.optionsSeries(initOptions, 0, mySeries) ];
		
		var options = { series: series };
		chart.echartsOptions(options);
	};
	
	//矩形树图
	chartSupport.treemapRender = function(chart, idSign, nameSign, parentSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			series: [{
				name: "",
				type: "treemap",
				data: []
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.treemapUpdate = function(chart, results, idSign, nameSign, parentSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		
		var mySeries = chartSupport.buildTreeNodeSeries(chart, results, idSign, nameSign, parentSign, valueSign);
		var series = [ chartSupport.optionsSeries(initOptions, 0, mySeries) ];
		
		var options = { series: series };
		chart.echartsOptions(options);
	};

	//旭日图
	
	chartSupport.sunburstRender = function(chart, idSign, nameSign, parentSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			series: [{
				name: "",
				type: "sunburst",
				data: []
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.sunburstUpdate = function(chart, results, idSign, nameSign, parentSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		
		var mySeries = chartSupport.buildTreeNodeSeries(chart, results, idSign, nameSign, parentSign, valueSign);
		var series = [ chartSupport.optionsSeries(initOptions, 0, mySeries) ];
		
		var options = { series: series };
		chart.echartsOptions(options);
	};
	
	chartSupport.buildTreeNodeSeries = function(chart, results, idSign, nameSign, parentSign, valueSign)
	{
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var seriesName = "";
		var seriesData = [];
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var result = chart.resultAt(results, i);
			
			if(i == 0)
				seriesName = chart.dataSetName(chartDataSet);

			var np = chart.dataSetPropertyOfSign(chartDataSet, nameSign);
			var ip = (chart.dataSetPropertyOfSign(chartDataSet, idSign) || np);
			var pp = chart.dataSetPropertyOfSign(chartDataSet, parentSign);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			
			var data = chart.resultDatas(result);
			
			for(var i=0; i<data.length; i++)
			{
				var node = {};
				node.id = chart.resultRowCell(data[i], ip);
				node.name = chart.resultRowCell(data[i], np);
				node.parent = chart.resultRowCell(data[i], pp);
				if(vp)
				{
					node.value = chart.resultRowCell(data[i], vp);
					chartSupport.treeNodeEvalValueMark(node);
				}
				
				var added = false;
				for(var j=0; j<seriesData.length; j++)
				{
					if(chartSupport.treeAppendNode(seriesData[j], node))
					{
						added = true;
						break;
					}
				}
				
				if(!added)
					seriesData.push(node);
			}
		}
		
		return { name: seriesName, data: seriesData };
	};
	
	chartSupport.treeNodeEvalValueMark = function(node)
	{
		//标识节点值需要动态计算
		if(node.value == null || node.value == 0)
			node._evalValue = true;
	};
	
	chartSupport.treeAppendNode = function(treeNode, node)
	{
		if(!treeNode)
			return false;
		
		if(node.parent == treeNode.id)
		{
			if(!treeNode.children)
				treeNode.children = [];
			
			treeNode.children.push(node);
			
			//动态计算父节点的值
			if(treeNode._evalValue && typeof(node.value) == "number")
			{
				var treeNodeValue = (treeNode.value || 0);
				treeNode.value = treeNodeValue + node.value;
			}
			
			return true;
		}
		
		if(!treeNode.children)
			return false;
		
		for(var i=0; i<treeNode.children.length; i++)
		{
			if(chartSupport.treeAppendNode(treeNode.children[i], node))
			{
				//动态计算treeNode的值
				if(treeNode._evalValue && typeof(treeNode.children[i].value) == "number")
				{
					var treeNodeValue = (treeNode.value || 0);
					treeNode.value = treeNodeValue + treeNode.children[i].value;
				}
				
				return true;
			}
		}
		
		return false;
	};
	
	//桑基图

	chartSupport.sankeyRender = function(chart, sourceNameSign, sourceValueSign, targetNameSign, targetValueSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			series: [{
				name: "",
				type: "sankey",
		        layout: "none",
				data: [],
				links: [],
				left: "16%",
                right: "16%",
                top: "12%",
                bottom: "12%",
		        focusNodeAdjacency: 'allEdges'
			}]
		},
		options));
		
		//自适应条目宽度和间隔
		var chartEle = chart.elementJquery();
		var orient = options.series[0].orient;
		
		var nodeWidth = options.series[0].nodeWidth;
		if(nodeWidth == null)
		{
			var totalWidth = (orient == "vertical" ? chartEle.height() : chartEle.width());
			nodeWidth = parseInt(totalWidth * 5/100);
			nodeWidth = (nodeWidth < 4 ? 4: nodeWidth);
			options.series[0].nodeWidth = nodeWidth;
		}
		
		var nodeGap = options.series[0].nodeGap;
		if(nodeGap == null)
		{
			var totalWidth = (orient == "vertical" ? chartEle.width() : chartEle.height());
			nodeGap = parseInt(totalWidth * 2/100);
			nodeGap = (nodeWidth < 1 ? 1: nodeGap);
			options.series[0].nodeGap = nodeGap;
		}
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.sankeyUpdate = function(chart, results, sourceNameSign, sourceValueSign, targetNameSign, targetValueSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var seriesName = "";
		var seriesData = [];
		var seriesLinks = [];
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var result = chart.resultAt(results, i);
			
			if(i == 0)
				seriesName = chart.dataSetName(chartDataSet);
			
			var snp = chart.dataSetPropertyOfSign(chartDataSet, sourceNameSign);
			var svp = chart.dataSetPropertyOfSign(chartDataSet, sourceValueSign);
			var tnp = chart.dataSetPropertyOfSign(chartDataSet, targetNameSign);
			var tvp = chart.dataSetPropertyOfSign(chartDataSet, targetValueSign);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			
			var data = chart.resultDatas(result);
			
			for(var i=0; i<data.length; i++)
			{
				var sd = { name: chart.resultRowCell(data[i], snp) };
				var td = { name: chart.resultRowCell(data[i], tnp) };
				
				if(svp)
					sd.value = chart.resultRowCell(data[i], svp);
				if(tvp)
					td.value = chart.resultRowCell(data[i], tvp);
				
				var link = {};
				link.source = sd.name;
				link.target = td.name;
				link.value = chart.resultRowCell(data[i], vp);
				
				chartSupport.appendDistinct(seriesData, sd, "name");
				chartSupport.appendDistinct(seriesData, td, "name");
				seriesLinks.push(link);
			}
		}
		
		var series = [ chartSupport.optionsSeries(initOptions, 0, { name: seriesName, data: seriesData, links: seriesLinks }) ];
		
		var options = { series: series };
		chart.echartsOptions(options);
	};
	
	//关系图
	
	chartSupport.graphRender = function(chart, sourceIdSign, sourceNameSign, sourceCategorySign, sourceValueSign,
			targetIdSign, targetNameSign, targetCategorySign, targetValueSign, valueSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			//最大数据标记像素数
			symbolSizeMax: undefined,
			//最大数据标记像素数
			symbolSizeMin: undefined,
			series: [{
				name: "",
				type: "graph",
		        layout: "force",
				data: [],
				links: [],
				legendHoverLink: true,
                focusNodeAdjacency: true,
                draggable: true,
				label: { position: "right" },
				roam: true,
				left: "12%",
                right: "12%",
                top: "20%",
                bottom: "12%",
			}]
		},
		options));
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};

	chartSupport.graphUpdate = function(chart, results, sourceIdSign, sourceNameSign, sourceCategorySign, sourceValueSign,
			targetIdSign, targetNameSign, targetCategorySign, targetValueSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var legendData = [];
		var seriesName = "";
		var categories = [];
		var seriesData = [];
		var seriesLinks = [];
		
		var min = undefined, max = undefined;
		var symbolSizeMax = chartSupport.scatterSymbolSizeMax(chart, initOptions);
		var symbolSizeMin = chartSupport.scatterSymbolSizeMin(chart, initOptions, symbolSizeMax);
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var result = chart.resultAt(results, i);
			
			if(i == 0)
				seriesName = chart.dataSetName(chartDataSet);
			
			var sip = chart.dataSetPropertyOfSign(chartDataSet, sourceIdSign);
			var snp = chart.dataSetPropertyOfSign(chartDataSet, sourceNameSign);
			var scp = chart.dataSetPropertyOfSign(chartDataSet, sourceCategorySign);
			var svp = chart.dataSetPropertyOfSign(chartDataSet, sourceValueSign);
			var tip = chart.dataSetPropertyOfSign(chartDataSet, targetIdSign);
			var tnp = chart.dataSetPropertyOfSign(chartDataSet, targetNameSign);
			var tcp = chart.dataSetPropertyOfSign(chartDataSet, targetCategorySign);
			var tvp = chart.dataSetPropertyOfSign(chartDataSet, targetValueSign);
			var vp = chart.dataSetPropertyOfSign(chartDataSet, valueSign);
			
			var data = chart.resultDatas(result);
			
			for(var i=0; i<data.length; i++)
			{
				var sd = { name: chart.resultRowCell(data[i], snp) };
				var td = { name: chart.resultRowCell(data[i], tnp) };
				
				if(sip)
					sd.id = chart.resultRowCell(data[i], sip);
				
				if(scp)
				{
					var category = chart.resultRowCell(data[i], scp);
					if(category)
					{
						sd.category = chartSupport.appendDistinct(categories, {name: category}, "name");
						chartSupport.appendDistinct(legendData, category);
					}
				}
				
				if(svp)
				{
					sd.value = chart.resultRowCell(data[i], svp);
					
					min = (min == undefined ? sd.value : Math.min(min, sd.value));
					max = (max == undefined ? sd.value : Math.max(max, sd.value));
				}
				
				if(tip)
					td.id = chart.resultRowCell(data[i], tip);
				
				if(tcp)
				{
					var category = chart.resultRowCell(data[i], tcp);
					if(category)
					{
						td.category = chartSupport.appendDistinct(categories, {name: category}, "name");
						chartSupport.appendDistinct(legendData, category);
					}
				}
				
				if(tvp)
				{
					td.value = chart.resultRowCell(data[i], tvp);
					
					min = (min == undefined ? td.value : Math.min(min, td.value));
					max = (max == undefined ? td.value : Math.max(max, td.value));
				}
				
				var sidx = chartSupport.appendDistinct(seriesData, sd, (sip ? "id" : "name"));
				var tidx = chartSupport.appendDistinct(seriesData, td, (tip ? "id" : "name"));

				//如果使用id值表示关系，对于数值型id，echarts会误当做数据索引，所以这里直接使用数据索引
				var link = {};
				link.source = sidx;
				link.target = tidx;
				
				if(vp)
					link.value = chart.resultRowCell(data[i], vp);
				
				seriesLinks.push(link);
			}
		}
		
		if(min != undefined && max != undefined && min >= max)
			min = max - 1;
		
		if(min == undefined && max == undefined && symbolSizeMin < 10)
			symbolSizeMin = 10;
		
		var series = [ chartSupport.optionsSeries(initOptions, 0, { name: seriesName, categories: categories, data: seriesData, links: seriesLinks }) ];
		
		//自动计算散点大小
		if(series[0].symbolSize == null)
		{
			series[0].symbolSize = function(value, params)
			{
				if(value && value.length > 0)
					value = value[0];
				
				if(value == null)
					return symbolSizeMin;
				
				return chartSupport.scatterEvalSymbolSize(value, min, max, symbolSizeMax, symbolSizeMin);
			};
		}
		
		if(series[0].layout == "force")
		{
			if(!series[0].force)
				series[0].force = {};
			
			//自动计算散点间距
			if(series[0].force.edgeLength == null)
				series[0].force.edgeLength = parseInt(symbolSizeMax*1.5);
			
			//自动计算散点稀疏度
			if(series[0].force.repulsion == null)
				series[0].force.repulsion = parseInt(symbolSizeMax*2);
		}
		
		var options = { legend: {data: legendData}, series: series };
		chart.echartsOptions(options);
	};
	
	//词云图
	
	chartSupport.wordcloudRender = function(chart, nameSign, valueSign, options)
	{
		//不支持在echarts主题中设置样式，只能在这里设置
		var chartTheme = (chart.theme() || {});
		
		options = chart.options($.extend(true,
		{
			title: {
		        text: chart.nameNonNull()
		    },
			tooltip:
			{
				trigger: "item"
			},
			//自定义由低到高值域颜色映射
			colorRange: chartTheme.graphRangeColors,
			//自定义由低到高值渐变色数组，如果不设置，将由colorRange自动计算
			colorGradients: undefined,
			series:
			[
				{
					type: "wordCloud",
					shape: "circle",
					data: [],
					"textStyle":
					{
						"normal":{},
						"emphasis":
						{
							"shadowBlur" : 10,
							"shadowColor" : chartTheme.axisColor,
						}
					}
				}
			]
		},
		options));
		
		var chartEle = chart.elementJquery();
		
		//自适应字体大小
		var sizeRange = options.series[0].sizeRange;
		if(sizeRange == null)
		{
			var chartSize = Math.min(chartEle.height(), chartEle.width());
			sizeRange = [parseInt(chartSize * 1/40), parseInt(chartSize * 1/8)];
			sizeRange[0] = (sizeRange[0] < 6 ? 6: sizeRange[0]);
			options.series[0].sizeRange = sizeRange;
		}
		
		//计算渐变色
		var colorRange = options.colorRange;
		if(colorRange != null)
		{
			var colorGradients = [];
			for(var i=0; i<colorRange.length; i++)
			{
				var fromColor = colorRange[i];
				var toColor = ((i+1) < colorRange.length ? colorRange[i+1] : null);
				
				if(!toColor)
					break;
				
				colorGradients = colorGradients.concat(chartFactory.evalGradientColors(fromColor, toColor, 5));
			}
			
			options.colorGradients = colorGradients;
		}
		
		chartSupport.initOptions(chart, options);
		
		chart.echartsInit(options, false);
	};
	
	chartSupport.wordcloudUpdate = function(chart, results, nameSign, valueSign)
	{
		var initOptions= chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();

		var seriesName = "";
		var seriesData = [];
		var min = undefined, max=undefined;
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var result = chart.resultAt(results, i);

			var data = chart.resultNameValueObjects(result, chart.dataSetPropertyOfSign(chartDataSet, nameSign),
					chart.dataSetPropertyOfSign(chartDataSet, valueSign));
			
			for(var i=0; i<data.length; i++)
			{
				min = (min == undefined ? data[i].value : Math.min(min, data[i].value));
				max = (max == undefined ? data[i].value : Math.max(max, data[i].value));
			}
			
			seriesData = seriesData.concat(data);
		}
		
		if(min >= max)
			min = max - 1;
		
		//映射颜色值
		var colorGradients = initOptions.colorGradients;
		if(colorGradients)
		{
			for(var i=0; i<seriesData.length; i++)
			{
				var colorIndex = parseInt((seriesData[i].value-min)/(max-min) * (colorGradients.length-1));
				seriesData[i].textStyle = { "normal":{ "color": colorGradients[colorIndex] } };
			}
		}
		
		var series = [ chartSupport.optionsSeries(initOptions, 0, {name: seriesName, data: seriesData}) ];
		
		var options = { series: series };
		chart.echartsOptions(options);
	};
	
	//表格
	
	chartSupport.tableRender = function(chart, columnSign, options)
	{
		var chartDataSet = chart.chartDataSetFirst();
		var cps = chart.dataSetPropertiesOfSign(chartDataSet, columnSign);
		if(!cps || cps.length == 0)
			cps =(chartDataSet && chartDataSet.dataSet ? (chartDataSet.dataSet.properties || []) : []);
		
		var columns = [];
		
		for(var i=0; i<cps.length; i++)
		{
			var column =
			{
				title: chart.dataSetPropertyLabel(cps[i]),
				data: cps[i].name,
				defaultContent: "",
				orderable: true,
				searchable: false
			};
			
			columns.push(column);
		}
		
		var chartEle = chart.elementJquery();
		chartEle.addClass("dg-chart-table");
		
		options = chart.options($.extend(true,
		{
			//自定义图表标题设置项
			"title": { "show": true },
			"columns" : columns,
			"data" : [],
			"scrollX": true,
			"autoWidth": true,
			"scrollY" : chartEle.height(),
	        "scrollCollapse": false,
			"paging" : false,
			"searching" : false,
			"info": false,
			"select" : { style : 'os' },
			"dom": "t",
			"language":
		    {
				"emptyTable": "",
				"zeroRecords" : ""
			}
		},
		options));
		
		if(!options.title || !options.title.show)
			chartEle.addClass("dg-hide-title");
		
		var chartTitle = $("<div class='dg-chart-table-title' />").html(chart.nameNonNull()).appendTo(chartEle);
		var chartContent = $("<div class='dg-chart-table-content' />").appendTo(chartEle);
		var table = $("<table width='100%' class='hover stripe'></table>").appendTo(chartContent);
		var tableId = chart.id+"-table";
		table.attr("id", tableId);
		
		table.dataTable(options);
		
		var dataTable = table.DataTable();
		var tableHeader = $(dataTable.table().header()).closest(".dataTables_scrollHead");
		var tableBody = $(dataTable.table().body()).closest(".dataTables_scrollBody");
		var tableToolbar = $(dataTable.table().body()).closest(".dataTables_scrollBody");
		tableBody.css("height", chartContent.height() - tableHeader.outerHeight());
		
		chart.extValue("tableId", tableId);
		chartSupport.initOptions(chart, options);
	};
	
	chartSupport.tableUpdate = function(chart, results, options)
	{
		var initOptions = chartSupport.initOptions(chart);
		var chartDataSets = chart.chartDataSetsNonNull();
		var tableId = chart.extValue("tableId");
		var dataTable = $("#" + tableId).DataTable();
		
		var datas = [];
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var result = chart.resultAt(results, i);
			
			if(result.datas)
				datas = datas.concat(result.datas);
		}
		
		chartSupport.tableAddDataTableData(dataTable, datas, 0, false);
	};
	
	chartSupport.tableAddDataTableData = function(dataTable, datas, startRowIndex, notDraw)
	{
		var rows = dataTable.rows();
		var removeRowIndexes = [];
		var dataIndex = 0;
		
		if(startRowIndex != null)
		{
			rows.every(function(rowIndex)
			{
				if(rowIndex < startRowIndex)
					return;
				
				if(dataIndex >= datas.length)
					removeRowIndexes.push(rowIndex);
				else
					this.data(datas[dataIndex]);
				
				dataIndex++;
			});
		}
		
		for(; dataIndex<datas.length; dataIndex++)
			var row = dataTable.row.add(datas[dataIndex]);
		
		dataTable.rows(removeRowIndexes).remove();
		
		if(!notDraw)
			dataTable.draw();
	};

	//标签卡
	
	chartSupport.labelRender = function(chart, coordSign, valueSign, options)
	{
		var chartEle = chart.elementJquery();
		chartEle.addClass("dg-chart-label");
		
		options = chart.options($.extend(true,
		{
			valueFirst: false,    //是否标签值在前
			showName: true        //是否绘制标签名
		},
		options));
		
		chartSupport.initOptions(chart, options);
	};
	
	chartSupport.labelUpdate = function(chart, results, coordSign, valueSign)
	{
		var options = chartSupport.initOptions(chart);
		var valueFirst = options.valueFirst;
		var showName = options.showName;
		options = chart.optionsModified(options);
		var clear = (valueFirst != options.valueFirst || showName != options.showName);
		
		var chartDataSets = chart.chartDataSetsNonNull();
		
		var $parent = chart.elementJquery();
		
		if(clear)
			$(".dg-chart-label-item", $parent).empty();
		else
			$(".dg-chart-label-item", $parent).addClass("dg-chart-label-item-pending");
		
		for(var i=0; i<chartDataSets.length; i++)
		{
			var chartDataSet = chartDataSets[i];
			var dataSetName = chart.dataSetName(chartDataSet);
			var result = chart.resultAt(results, i);
			
			var cps = chart.dataSetPropertiesOfSign(chartDataSet, coordSign);
			var vps = chart.dataSetPropertiesOfSign(chartDataSet, valueSign);
			var cv = (cps.length > 0 ? chart.resultRowArrays(result, cps) : [] );
			var vv = chart.resultRowArrays(result, vps);
			
			for(var j=0; j<vv.length; j++)
			{
				var vvj = vv[j];
				
				for(var k=0; k<vvj.length; k++)
				{
					var cssName = "dg-chart-label-item-"+i+"-"+j+"-"+k;
					var name = (cv.length > j && cv[j].length > k ? cv[j][k] : chart.dataSetPropertyLabel(vps[k]));
					var value = vv[j][k];
					
					var $label = $("."+ cssName, $parent);
					if($label.length == 0)
						$label = $("<div class='dg-chart-label-item dg-chart-label-item-"+i+" dg-chart-label-item-"+i+"-"+j+" "+cssName+"'></div>").appendTo($parent);
					else
						$label.removeClass("dg-chart-label-item-pending");
					
					var $labelName = $(".label-name", $label);
					var $labelValue = $(".label-value", $label);
					
					if(options.showName)
					{
						if(options.valueFirst && $labelValue.length == 0)
							$labelValue = $("<div class='label-value'></div>").appendTo($label);
						
						if($labelName.length == 0)
							$labelName = $("<div class='label-name'></div>").appendTo($label);
						
						if(!options.valueFirst && $labelValue.length == 0)
							$labelValue = $("<div class='label-value'></div>").appendTo($label);
					}
					else
					{
						if($labelValue.length == 0)
							$labelValue = $("<div class='label-value'></div>").appendTo($label);
					}
					
					if(options.showName)
						$labelName.html(name);
					$labelValue.html(value);
				}
			}
		}
		
		$(".dg-chart-label-item-pending", $parent).remove();
	};
	
	//自定义
	
	chartSupport.customAsyncRender = function(chart)
	{
		var customRenderer = chartSupport.customGetCustomRenderer(chart);
		
		if(!customRenderer || customRenderer.asyncRender == undefined)
			return false;
		
		if(typeof(customRenderer.asyncRender) == "function")
			return customRenderer.asyncRender(chart);
		
		return (customRenderer.asyncRender == true);
	};
	
	chartSupport.customRender = function(chart)
	{
		var customRenderer = chartSupport.customGetCustomRenderer(chart);
		
		if(customRenderer)
			customRenderer.render(chart);
	};
	
	chartSupport.customAsyncUpdate = function(chart, results)
	{
		var customRenderer = chartSupport.customGetCustomRenderer(chart);
		
		if(!customRenderer || customRenderer.asyncUpdate == undefined)
			return false;
		
		if(typeof(customRenderer.asyncUpdate) == "function")
			return customRenderer.asyncUpdate(chart, results);
		
		return (customRenderer.asyncUpdate == true);
	};
	
	chartSupport.customUpdate = function(chart, results)
	{
		var customRenderer = chartSupport.customGetCustomRenderer(chart);
		
		if(customRenderer)
			customRenderer.update(chart, results);
	};
	
	chartSupport.customGetCustomRenderer = function(chart)
	{
		var customRenderer = chart.extValue("customRenderer");
		
		if(customRenderer == "_undefined")
			return undefined;
		
		if(customRenderer)
			return customRenderer;
		
		var $element = chart.elementJquery();
		var customRendererVar = $element.attr("dg-chart-renderer");
		
		if(!customRendererVar)
			$element.html("The 'dg-chart-renderer' attribute must be set for this custom chart");
		else
		{
			customRenderer = chartFactory.evalSilently(customRendererVar);
			
			if(!customRenderer)
				$element.html("No chart renderer var '"+customRendererVar+"' defined for this custom chart");
		}
		
		chart.extValue("customRenderer", (customRenderer || "_undefined"));
		
		return customRenderer;
	};
})
(this);