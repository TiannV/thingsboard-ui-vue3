<template>
  <div class="table-settings">
    <CardListSetting v-if="getSetting.card" :getPopupContainer="getTableContainer"/>
    <RedoSetting v-if="getSetting.redo" :getPopupContainer="getTableContainer" />
    <SizeSetting v-if="getSetting.size" :getPopupContainer="getTableContainer" />
    <ColumnSetting
      v-if="getSetting.setting"
      @columns-change="handleColumnChange"
      :getPopupContainer="getTableContainer"
    />
    <FullScreenSetting v-if="getSetting.fullScreen" :getPopupContainer="getTableContainer" />
  </div>
</template>
<script lang="ts">
  import type { PropType } from 'vue';
  import type { TableSetting, ColumnChangeParam } from '../../types/table';
  import { defineComponent, computed, unref } from 'vue';
  import ColumnSetting from './ColumnSetting.vue';
  import SizeSetting from './SizeSetting.vue';
  import RedoSetting from './RedoSetting.vue';
  import FullScreenSetting from './FullScreenSetting.vue';
  import CardListSetting from './CardListSetting.vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useTableContext } from '../../hooks/useTableContext';

  export default defineComponent({
    name: 'TableSetting',
    components: {
      ColumnSetting,
      SizeSetting,
      RedoSetting,
      FullScreenSetting,
      CardListSetting,
    },
    props: {
      setting: {
        type: Object as PropType<TableSetting>,
        default: () => ({}),
      },
    },
    emits: ['columns-change'],
    setup(props, { emit }) {
      const { t } = useI18n();
      const table = useTableContext();

      const getSetting = computed((): TableSetting => {
        return {
          redo: true,
          card: false,
          size: true,
          setting: true,
          fullScreen: false,
          ...props.setting,
        };
      });

      function handleColumnChange(data: ColumnChangeParam[]) {
        emit('columns-change', data);
      }

      function getTableContainer() {
        return table ? unref(table.wrapRef) : document.body;
      }

      return { getSetting, t, handleColumnChange, getTableContainer };
    },
  });
</script>
<style lang="less">
  html[data-theme='dark'] {
    .table-settings {
      color: rgb(255 255 255 / 75%);
    }
  }

  .table-settings {
    & > * {
      margin-left: 4px;
      margin-right: 8px;
      margin-top: 6px;
    }

    svg {
      width: 1.3em;
      height: 1.3em;
    }
  }
</style>
