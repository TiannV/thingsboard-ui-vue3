<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%"
    :rootClassName="'tb-detail-wrapper'">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 tb-detail-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}
            <Tag class="text-base font-normal" color="success" v-if="record.default == true">默认</Tag>
          </span>
          <span class="text-sm">设备配置详情</span>
        </div>
      </div>
    </template>
    <Tabs v-model:activeKey="tabActiveKey" class="tb-detail-menu">
      <TabPane key="DETAIL">
        <template #tab><span>
            <Icon :icon="'ant-design:appstore-outlined'" /> 详情
          </span> </template>
        <div class="space-x-4">
          <a-button type="primary" @click="handleSetDefault"
            v-if="!(record.name == 'TbServiceQueue' || record.default == true)">
            <Icon :icon="'ant-design:flag-outlined'" />设为默认设备配置
          </a-button>
          <a-button type="primary success" @click="handleEditDeviceProfile">
            <Icon :icon="'i-clarity:note-edit-line'" />编辑设备配置
          </a-button>
          <a-button type="primary" danger @click="handleDeleteDeviceProfile"
            v-if="!(record.name == 'TbServiceQueue' || record.default == true)">
            <Icon :icon="'ant-design:delete-outlined'" />删除设备配置
          </a-button>
        </div>
        <div class="space-x-4  my-4">
          <a-button @click="handleCopyDeviceProfileId">
            <Icon :icon="'ant-design:copy-filled'" />
            复制设备配置ID
          </a-button>
        </div>
        <Description @register="register" size="default">
          <template #defaultRuleChain="{ data }">
            {{ data?.defaultRuleChain?.name }}
          </template>
          <template #defaultDashboard="{ data }">
            {{ data?.defaultDashboard?.title }}
          </template>
          <template #defaultEdgeRuleChain="{ data }">
            {{ data?.defaultEdgeRuleChain?.name }}
          </template>
          <template #image="{ data }">
            <Image :src="data?.image" :width="300" />
          </template>
        </Description>
      </TabPane>
      <TabPane key="TRANSPORT">
        <template #tab><span>
            <Icon :icon="'ant-design:cloud-upload-outlined'" /> 传输配置
          </span> </template>
        <div class="border border-solid border-neutral-300 p-4">
          <TransportForm class="pointer-events-none" ref="transportFrom" />
        </div>
      </TabPane>
      <TabPane key="ALARM">
        <template #tab><span>
            <Icon :icon="'ant-design:bell-outlined'" /> 报警配置({{ record.profileData?.alarms?.length || 0 }})
          </span> </template>
        <div class="border border-solid border-neutral-300 p-4">
          <AlarmForm class="pointer-events-none" ref="alarmFrom" />
        </div>
      </TabPane>
      <TabPane key="PROVISION">
        <template #tab><span>
            <Icon :icon="'ant-design:file-protect-outlined'" /> 设备预配置
          </span> </template>
        <div class="border border-solid border-neutral-300 p-4">
          <ProvisionForm class="pointer-events-none" ref="provisionFrom" />
        </div>
      </TabPane>
      <TabPane key="AUDIT_LOG" v-if="hasPermission(Authority.TENANT_ADMIN)">
        <template #tab><span>
            <Icon :icon="'ant-design:bars-outlined'" /> 审计日志
          </span> </template>
        <AuditLog :entityType="EntityType.DEVICE_PROFILE" :entityId="record?.id?.id" />
      </TabPane>
    </Tabs>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbDeviceProfileDetail">
import { ref, computed, unref, watch, nextTick, } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { copyToClipboard } from '/@/utils';
import { Tabs, TabPane, Image, Tag } from 'ant-design-vue';
import { Icon } from '/@/components/Icon';
import { getRuleChainById } from '/@/api/tb/ruleChain';
import { usePermission } from '/@/hooks/web/usePermission';
import { getDashboardInfoById } from '/@/api/tb/dashboard';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { getDeviceProfileById, DeviceProfile } from '/@/api/tb/deviceProfile';
import { useUserStore } from '/@/store/modules/user';
import { Authority } from '/@/enums/authorityEnum';
import AuditLog from '/@/views/tb/auditLog/list.vue';
import { DescItem, Description, useDescription } from '/@/components/Description';
import { router } from '/@/router';
import { EntityType } from '/@/enums/entityTypeEnum';
import TransportForm from './transport/transportForm.vue';
import AlarmForm from './alarm/alarmForm.vue';
import ProvisionForm from './provisionForm.vue';
import { ProvisionType, TransportType } from '/@/enums/deviceEnum';


const userStore = useUserStore();

const emit = defineEmits(['edit', 'delete', 'default', 'register',]);
const { hasPermission } = usePermission();

const { t } = useI18n('tb');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<DeviceProfile>({} as DeviceProfile);

const getTitle = computed(() => ({
  icon: meta.icon || 'ant-design:book-outlined',
  value: record.value.name,
}));

const tabActiveKey = ref('DETAIL');

const transportFrom = ref<any>(null);
const alarmFrom = ref<any>(null);
const provisionFrom = ref<any>(null);


const descSchema: DescItem[] = [
  {
    label: t('资产配置名称'),
    field: 'name',
    span: 4,
  },
  {
    label: t('默认规则链'),
    field: 'defaultRuleChain',
    slot: 'defaultRuleChain',
    span: 4,
  },
  {
    label: t('移动端仪表盘'),
    field: 'defaultDashboard',
    slot: 'defaultDashboard',
    span: 4,
  },
  {
    label: t('队列'),
    field: 'defaultQueueName',
    span: 4,
  },
  {
    label: t('边缘规则链'),
    field: 'defaultEdgeRuleChain',
    slot: 'defaultEdgeRuleChain',
    span: 4,
  },
  {
    label: t('图片'),
    field: 'image',
    slot: 'image',
    span: 4,
  },
  {
    label: t('描述信息'),
    field: 'description',
    span: 4,
  },
];
const [register, { setDescProps }] = useDescription({
  schema: descSchema,
})



const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  try {
    setDrawerProps({ loading: true });
    await clear();
    record.value = await getDeviceProfileById(data.id.id);
    if (record.value.defaultRuleChainId?.id) {
      record.value.defaultRuleChain = await getRuleChainById(record.value.defaultRuleChainId.id)
    }
    if (record.value.defaultDashboardId?.id) {
      record.value.defaultDashboard = await getDashboardInfoById(record.value.defaultDashboardId.id)
    }
    if (record.value.defaultEdgeRuleChainId?.id) {
      record.value.defaultEdgeRuleChain = await getRuleChainById(record.value.defaultEdgeRuleChainId.id)
    }
    setDescProps({ data: record.value });



  } catch (error: any) {
    if (error.message) {
      showMessage(error.message, 'error')
    }
    console.log('error', error);
  } finally {
    setDrawerProps({ loading: false });
  }
});

watch(
  () => tabActiveKey.value,
  () => {
    if (tabActiveKey.value == 'ALARM') {
      nextTick(() => {
        if (alarmFrom.value != null) {
          alarmFrom.value.setFieldsValue(record.value?.profileData?.alarms || []);
        }
      })
    } else if (tabActiveKey.value == 'TRANSPORT') {
      nextTick(() => {
        if (transportFrom.value != null) {
          transportFrom.value.setFieldsValue(record.value?.profileData?.transportConfiguration || { type: TransportType.DEFAULT },);
        }
      })
    } else if (tabActiveKey.value == 'PROVISION') {
      nextTick(() => {
        if (provisionFrom.value != null) {
          provisionFrom.value.setFieldsValue(
            { ...record.value?.profileData?.provisionConfiguration, provisionDeviceKey: record.value?.provisionDeviceKey }
            || { type: ProvisionType.DISABLED, provisionDeviceKey: null }
          );
        }
      })
    }
  }
)

async function clear() {
  record.value = {} as DeviceProfile;
  tabActiveKey.value = 'DETAIL';
  setDescProps({ data: {} });
}


function handleCopyDeviceProfileId() {
  copyToClipboard(record.value.id.id, '复制设备配置ID成功！')
}

function handleDeleteDeviceProfile() {
  emit('delete', record.value);
  closeDrawer();
}

function handleEditDeviceProfile() {
  emit('edit', record.value);
  closeDrawer();
}

function handleSetDefault() {
  emit('default', record.value);
  closeDrawer();
}




</script>
<style lang="less">
.detail-info-card {
  // .jeesite-basic-table {
  //   padding: 0;

  //   .jeesite-basic-table-header__header-top {
  //     display: none;
  //   }
  // }
}
</style>
