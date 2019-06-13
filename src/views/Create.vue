<template>
    <b-container class="crossword-create-wrapper">
        <b-row class="mt-4">
            <b-col>
                <b-card>
                    <b-card>
                        <b-card-header>Instructions</b-card-header>
                        <b-card-body>
                            <ul class="text-left">
                                <li>
                                    Double click a column to index it as start of a word.<br>
                                    Double click again to un-index it.
                                </li>
                                <li>
                                    Long press an indexed column to highlight vertical and horizontal words.<br>
                                    Long press a non indexed column to disable that column.<br>
                                    Long press again to make it normal.
                                </li>
                                <li>
                                    Right click an indexed column to highlight the horizontal and vertical words.
                                </li>
                                <li>
                                    Light yellow highlighted columns is the word for vertical clue.<br>
                                    Light blue highlighted columns is the word for horizontal clue.
                                </li>
                            </ul>
                        </b-card-body>
                    </b-card>
                    <b-form-checkbox class="mt-3 mb-3" v-model="lock">Lock grid (this can prevent accidental change of
                        width and height resetting the grid completely)
                    </b-form-checkbox>
                    <div class="crossword-grid-generator" v-if="!lock">
                        <b-row>
                            <b-col cols="1">
                                <label>Width</label>
                            </b-col>
                            <b-col cols="5">
                                <b-input type="number" v-model.number="width" min="1" :max="limit"
                                         @change="generateGrid()" maxlength="2"></b-input>
                            </b-col>
                            <b-col cols="1">
                                <label>Height</label>
                            </b-col>
                            <b-col cols="5">
                                <b-input type="number" v-model.number="height" min="1" :max="limit"
                                         @change="generateGrid()" maxlength="2"></b-input>
                            </b-col>
                        </b-row>
                        <!--<b-button class="mt-3" @click="createGrid()">Create</b-button>-->
                    </div>
                    <div class="crossword-grid-wrapper mt-5"
                         v-if="Object.keys(grid).length>0 && width<=limit && height<=limit">
                        <div class="grid">
                            <template v-for="(gridRow,i) in grid">
                                <template v-if="typeof gridRow !== 'undefined'">
                                    <div class="grid-row" :style="{'width':(40*gridRow[0].length)+'px'}" :key="'i'+i">
                                        <template v-for="(gridColumn,j) in gridRow">
                                            <template v-if="typeof gridColumn !== 'undefined'">
                                            <span class="grid-column"
                                                  :class="[getHighlightClass(i,j),isBlackened(i,j)?'blackened':'']"
                                                  :key="i+' '+j">
                                                <span class="grid-index"
                                                      v-if="clueIndex(i,j)>0">{{clueIndex(i,j)}}</span>
                                                <label for="grid-input" class="d-none">Grid Input</label>
                                                <input class="grid-input text-center" title="Grid Input"
                                                       @dblclick="toggleIndexer(i,j)"
                                                       v-longpress="()=>highlightOrBlacken(i,j)"
                                                       @keypress="function(e) {
                                                         if(!(e.key >= 'a' && e.key <= 'z') || (e.key >= 'A' && e.key <= 'Z' )){
                                                            e.preventDefault();
                                                         }
                                                       }"
                                                       @input="gridColumn['value'] = $event.target.value.toUpperCase()"
                                                       :value="gridColumn['value'].toUpperCase()" id="grid-input"
                                                       maxlength="1">
                                            </span>
                                            </template>
                                        </template>
                                    </div>
                                </template>
                            </template>
                        </div>
                    </div>
                    <div v-else class="mt-5">
                        <h4>Max Width and Height is {{limit}}.</h4>
                    </div>
                </b-card>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import Vue from 'vue';

    export default {
        data() {
            return {
                width: 10,
                height: 10,
                limit: 15,
                lock: false,
                grid: {},
                clues: {},
                highlightClasses: {}
            }
        },
        methods: {
            generateGrid() {
                //Delete Excess Rows
                for (let y = Object.keys(this.grid).length; y > this.height - 1; y--) {
                    if(this.gridExists(y,0)) {
                        this.removeIndex(y); //Remove all indexes in this row.
                        Vue.delete(this.grid, y); //delete row from grid.
                    }
                }

                for (let i = 0; i < this.height; i++) {
                    if (typeof this.grid[i] === 'undefined') {
                        Vue.set(this.grid, i, {});
                    } else {
                        //Delete Excess columns
                        for (let x = Object.keys(this.grid[i]).length; x > this.width - 1; x--) {
                            if(this.gridExists(i,x)) {
                                this.removeIndex(i, x); //Remove any index that may exist for this column.
                                Vue.delete(this.grid[i], x); //Delete Column from grid.
                            }
                        }
                    }
                    for (let j = 0; j < this.width; j++) {
                        if (typeof this.grid[i][j] === 'undefined') {
                            Vue.set(this.grid[i], j, {
                                'blackened': false,
                                'value': '',
                            });
                        }
                    }
                }
            },
            toggleBlackening(i, j) {
                this.grid[i][j]['blackened'] = !this.grid[i][j]['blackened'];
                this.grid[i][j]['value'] = '';
                this.toggleIndexer(i, j, true); //Delete any indexer if exists
            },
            toggleIndexer(i, j, forceDelete = false) {
                //Do not index a blackened column
                if (this.isBlackened(i, j)) {
                    return;
                }

                //Delete an index if exists. This enables the toggling effect.
                if (typeof this.clues[i.toString() + j.toString()] !== "undefined" || forceDelete) {
                    this.removeIndex(i, j);
                } else {
                    Vue.set(this.clues, i.toString() + j.toString(), {});
                    Vue.set(this.clues[i.toString() + j.toString()], 'horizontal', {
                        'include': true,
                        'clue': ''
                    });
                    Vue.set(this.clues[i.toString() + j.toString()], 'vertical', {
                        'include': true,
                        'clue': ''
                    });
                }
            },
            removeIndex(i, j = null) {
                if (j == null) {
                    //This means indexes from an entire row must be removed.
                    for (let z = 0; z < Object.keys(this.grid[i]).length; z++) {
                        this.removeIndex(i, z); //Call this recursively on all available columns in that row.
                    }
                } else {
                    Vue.delete(this.clues, i.toString() + j.toString());
                }
            },
            clueIndex(i, j) {
                return Object.keys(this.clues).sort().indexOf(i.toString() + j.toString()) + 1;
            },
            clueKeyIndex(key) {
                return Object.keys(this.clues).sort().indexOf(key) + 1;
            },
            highlightOrBlacken(i, j) {
                this.highlightClasses = {};

                //Only proceed if column is indexed. Otherwise blacken the column
                if (this.clueIndex(i, j) <= 0) {
                    this.toggleBlackening(i, j);
                    return;
                }

                //Set origin class
                Vue.set(this.highlightClasses, i.toString() + j.toString(), 'highlight-origin');

                //Horizontal Highlights
                let h = parseInt(i) + 1;
                while (this.gridExists(h, j) && !this.isBlackened(h, j)) {
                    Vue.set(this.highlightClasses, h.toString() + j.toString(), 'highlight-horizontal');
                    h++;
                }

                //Vertical Highlights
                let v = parseInt(j) + 1;
                while (this.gridExists(i, v) && !this.isBlackened(i, v)) {
                    Vue.set(this.highlightClasses, i.toString() + v.toString(), 'highlight-vertical');
                    v++;
                }
            },
            getHighlightClass(i, j) {
                if (typeof this.highlightClasses[i.toString() + j.toString()] === 'undefined') {
                    return false;
                }
                return this.highlightClasses[i.toString() + j.toString()];
            },
            isBlackened(i, j) {
                if (!this.gridExists(i, j)) {
                    return false;
                }
                return this.grid[i][j]['blackened'];
            },
            gridExists(i, j) {
                return typeof this.grid[i] !== 'undefined' && typeof this.grid[i][j] !== 'undefined';
            }
        },
        created() {
            this.generateGrid();
        }
    }
</script>
<style>
    .grid {
        display: inline-block;
        box-shadow: 0 0 0 1px #ccc;
    }

    .grid-row {
        margin: auto;
    }

    .grid-input {
        height: 40px;
        width: 40px;
        font-size: 25px;
        background-color: transparent;
        border: none;
    }

    .crossword-grid-wrapper {
        text-align: center;
    }

    span.blackened {
        background-color: #000;
    }

    .grid-column {
        box-shadow: inset 0 0 0 1px #ccc;
        position: relative;
        display: inline-block;
    }

    .grid-index {
        position: absolute;
        top: 0;
        left: 4px;
        color: #555;
        font-size: 10px;
    }

    .grid-column.highlight-origin {
        background-color: #28a7455e;
    }

    .grid-column.highlight-vertical {
        background-color: #ffad075e;
    }

    .grid-column.highlight-horizontal {
        background-color: #17a2b85e;
    }
</style>
