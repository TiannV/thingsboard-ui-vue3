<template>
  <div class="scada-symbol-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleUpload({})">
            <Icon icon="ant-design:upload-outlined" /> 上传SCADA符号
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
            allow-clear
            @change="reload()"
            style="width: 240px"
          >
            <template #suffix>
              <icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
          <template v-if="hasPermission(Authority.TENANT_ADMIN)">
            <Checkbox v-model:checked="searchParam.includeSystemImages" @change="reload()">
              包含系统图像
            </Checkbox>
          </template>
        </div>
      </template>

      <template #firstColumn="{ record }">
        <Space size="middle">
          <div class="h-10 w-10 flex justify-center">
            <div class="cursor-pointer h-10 w-full content-center" @click="handleDetail(record)">
              <img :src="record.preview" :alt="record.name" class="w-full" />
            </div>
          </div>
          {{ record.title }}
        </Space>
      </template>
      <template #resolution="{ record }">
        {{ record.descriptor.width }}×{{ record.descriptor.height }}
      </template>
      <template #descriptorSize="{ record }">
        <div v-if="record.descriptor.size">
          {{ convertBytesToSize(record.descriptor.size) }}
        </div>
        <div v-else> - </div>
      </template>
      <template #isSystem="{ record }">
        <Checkbox :checked="record.link.indexOf('system') > -1" />
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbScadaSymbolList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { convertBytesToSize } from '/@/utils';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { imageList, imagePreview, deleteImage, downloadImage } from '/@/api/tb/images';
  import { Space, Checkbox, Image } from 'ant-design-vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';
  import { downloadByData } from '/@/utils/file/download';

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || 'CSADA 符号集',
  };

  const searchParam = reactive({
    textSearch: '',
    includeSystemImages: false,
  });

  const tableColumns: BasicColumn[] = [
    {
      title: t('名称'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('创建时间'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
    {
      title: '分辨率',
      dataIndex: 'descriptor.height',
      key: 'descriptor.height',
      align: 'center',
      width: 100,
      slot: 'resolution',
    },
    {
      title: t('文件大小'),
      dataIndex: 'descriptor.size',
      key: 'descriptor.size',
      sorter: true,
      width: 100,
      align: 'right',
      slot: 'descriptorSize',
    },
    {
      title: '系统',
      dataIndex: 'link',
      key: 'link',
      ifShow: hasPermission(Authority.TENANT_ADMIN),
      width: 80,
      align: 'center',
      slot: 'isSystem',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 180,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:download-outlined',
        title: t('下载图片'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'i-clarity:note-edit-line',
        color: 'success',
        title: t('修改图片'),
        onClick: handleDetail.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        ifShow: !!!(hasPermission(Authority.TENANT_ADMIN) && record.link.indexOf('system') > -1),
        title: t('删除图片'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: (param) => imageList(param, searchParam.includeSystemImages),
    beforeFetch: wrapFetchParams,
    afterFetch: handlePreviewImage,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    return {
      ...param,
      imageSubType: 'SCADA_SYMBOL',
      textSearch: searchParam.textSearch,
    };
  }

  async function handlePreviewImage(data: any[]) {
    for (let i = 0; i < data.length; i++) {
      await fetchPreviewImage(data[i]).then((base64) => (data[i].preview = base64));
    }
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: `确定删除图片${record.title}吗？`,
      content: '请注意：确认后，图片和所有相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteImage(record.link);
          showMessage('删除图片成功！');
          handleSuccess();
        } catch (error: any) {
          if (error.success == false) {
            forceDelete(record, error);
          }
          console.log(error);
        }
      },
    });
  }
  async function forceDelete(record: Recordable, errorMsg: any) {
    const showEntities: any[] = [];
    const types = Object.keys(errorMsg.references);
    types.forEach((type) => {
      const entities = errorMsg.references[type];
      entities.forEach((entity) => {
        showEntities.push({ type: type, name: entity.name });
      });
    });
    createConfirm({
      iconType: 'error',
      title: `图片被其他实体引用`,
      content: '请注意：确认后，图片和所有相关数据将不可恢复。',
      centered: false,
      okText: '强制删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteImage(record.link, true);
          showMessage('删除图片成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  async function fetchPreviewImage(record: Recordable) {
    return new Promise((resolve) => {
      imagePreview(record.link).then((file) => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          resolve(e.target?.result);
        };
        fileReader.readAsDataURL(file);
      });
    });
  }

  async function handleDownload(record: Recordable) {
    const res = await downloadImage(record.link);
    let name = res.headers['content-disposition'];
    name = name && name.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    name = name && name.length >= 1 && name[1].replace("utf-8'zh_cn'", '');
    downloadByData(res.data, name);
  }

  function handleSuccess() {
    reload();
  }

  function handleUpload(record: Recordable) {
    // openUploadModal(true, record);
  }

  function handleDetail(record: Recordable) {
    const path = record.link.replace('/api/images/', '');
    router.push(`/scada-symbol/${path}`);
  }
</script>

<style lang="less">
  .scada-symbol-list {
  }
</style>
