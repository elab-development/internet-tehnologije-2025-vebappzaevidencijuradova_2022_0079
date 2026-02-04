import {Input, Select} from "@/components/Input"
import {Button} from "@/components/Button"

export default function Home() {
  return (
    <div className="flex flex-col gap-2">
      <Button variant={"primary"}>
          Login
      </Button>
        <Input
            label={"Label"}
            type="text"
            required
        />
        <Select
            label="Role"

            options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
            ]}
        />

    </div>
  );
}
