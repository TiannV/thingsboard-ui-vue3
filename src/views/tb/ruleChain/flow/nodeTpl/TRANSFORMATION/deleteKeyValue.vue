<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="deleteFrom">
      <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
        <span>删除key</span>
        <Radio.Group v-model:value="formState.deleteFrom" button-style="solid">
          <Radio.Button value="DATA">消息</Radio.Button>
          <Radio.Button value="METADATA">元数据</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <Form.Item label="keys" name="Keys" :rules="[{ required: true, validator: validatorKeys, message: 'key值不能为空!' }]">
      <Select v-model:value="formState.keys" mode="tags">
      </Select>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
export default defineComponent({
  name: 'delete-key-value-pairs',
});
</script>
<script lang="ts" setup>
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Select, Radio } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash';

interface Configuration {
  deleteFrom: string;
  keys: [];
}

const props = defineProps({
  configuration: {
    type: Object as PropType<Configuration>,
    required: true,
  },
  ruleChainId: { type: String, default: '' }

});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
  deleteFrom: 'DATA',
  keys: [],
});

watch(
  () => props.configuration,
  () => {
    formState.deleteFrom = props.configuration.deleteFrom;
    formState.keys = props.configuration.keys;
  },
  { immediate: true },
);

async function getConfiguration() {
  try {
    return await formRef.value?.validate();
  } catch (error: any) {
    throw error;
  }
}

function validatorKeys() {
  if (!isEmpty(formState.keys)) {
    return Promise.resolve();
  } else {
    return Promise.reject('key必须填写一项！');
  }
}

defineExpose({ getConfiguration });
</script>
