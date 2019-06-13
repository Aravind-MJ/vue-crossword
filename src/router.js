import Vue from 'vue'
import Router from 'vue-router'
import Create from './views/Create.vue'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'create',
      component: Create
    },
    {
      path: '/play',
      name: 'play',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/Play.vue')
    }
  ]
})
