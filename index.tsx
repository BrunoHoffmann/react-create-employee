/* eslint-disable react/react-in-jsx-scope */
import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaCircleNotch,
  FaPlusCircle,
  FaTrashAlt,
  FaUpload,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast } from "react-toastify";
import * as Yup from "yup";

import api from "../../services/api";
import { App } from "../../components/App";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { IOption } from "../../utils/interfaces/option.interface";
import { ImgPreviewWrapper, NotFound } from "../../styles/global";

import {
  ButtonDelete,
  ButtonDeleteService,
  ContainerCreate,
  HeaderForm,
  Label,
  ListTimes,
  ServiceItem,
  Services,
  Time,
  Upload,
} from "./styles";

import getValidationErrors from "../../utils/getValidationErrors";
import { serviceWorkExample } from "./mocks/service-work-example";
import { IServiceWork } from "./interfaces/service-work";
import { EmployeeFormData } from "./interfaces/employee-form-data";

interface IService {
  id: string;
  name: string;
}

export function EmployeeCreate(): JSX.Element {
  const formRef = useRef<FormHandles>(null);
  const navegate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>();
  const [nameFile, setNameFile] = useState("");
  const [nameLink, setNameLink] = useState("");
  const [optionsService, setOptionsService] = useState<IOption[]>([]);
  const [selectedOptionActive, setSelectedOptionActive] =
    useState<IOption | null>({
      label: "Sim",
      value: "yes",
    });
  const optionsActive = [
    {
      label: "Sim",
      value: "yes",
    },
    {
      label: "Não",
      value: "no",
    },
  ];
  const [optionsHours, setOptionsHours] = useState<IOption[]>([]);
  const [employeeServices, setEmployeeServices] = useState<IServiceWork[]>([]);

  const setHoursOptions = useCallback(() => {
    const aux = [];
    for (let i = 0; i <= 23; i += 1) {
      for (let f = 0; f <= 45; f += 15) {
        const aux1 = i.toString().length === 1 ? `0${i}` : i;
        const aux2 = f === 0 ? `0${f}` : f;
        aux.push({
          label: `${aux1}:${aux2}`,
          value: `${aux1}:${aux2}`,
        });
      }
    }
    setOptionsHours(aux);
  }, []);

  const getServices = useCallback(async () => {
    try {
      const response = await api.get<IService[]>(`services`);

      setLoading(true);

      const aux = response.data.map((service) => {
        return {
          value: service.id,
          label: service.name,
        };
      });
      setOptionsService(aux);
    } catch (error: any) {
      let mensagem = "Ocorreu um erro";
      if (error.response.data.mensagem) {
        mensagem = error.response.data.mensagem;
      }

      toast.error(mensagem);
    }
  }, []);

  const handleSubmit = useCallback(
    async (data: EmployeeFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required("Nome obrigatório"),
          email: Yup.string().required("E-mail obrigatório"),
          password: Yup.string().required("Senha obrigatório"),
          passwordConfirmed: Yup.string().required(
            "Confirmação de senha obrigatório"
          ),
          phone_number: Yup.string().required("Número de telefone obrigatório"),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        if (!selectedOptionActive || !selectedOptionActive.value) {
          toast.error("É necessário informar um valor válido no campo Ativo.");
          return;
        }

        if (data.password !== data.passwordConfirmed) {
          toast.error("Senha e confirmação de senha precisam ser iguais.");
          return;
        }

        let photo;
        if (image) {
          const formData = new FormData();

          formData.append("file", image);
          const fileResponse = await api.post("/files", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          photo = fileResponse.data.file;
        }

        if (employeeServices.length > 0) {
          let error: string | null = null;
          employeeServices.forEach((item) => {
            if (!item.service_id) {
              error = "É necessário escolher um serviço para o funcionário.";
            }
          });

          if (error) {
            toast.error(error);
            return;
          }
        }

        await api.post("/employees", {
          name: data.name,
          nickname: data.nickname,
          email: data.email,
          password: data.password,
          phone_number: data.phone_number,
          active: selectedOptionActive.value === "yes",
          services: employeeServices,
          photo,
        });

        toast.success("Seu funcionário foi criada com sucesso.");
        navegate("/employees");
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          formRef.current?.setErrors(errors);
          return;
        }

        const { response } = err as any;
        if (response) toast.error(response.data.message);
        else toast.error("Ocorreu um erro ao tentar criar o funcionário.");
      }
    },
    [navegate, image, selectedOptionActive, employeeServices]
  );

  const handlePhotoChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setNameFile(e.target.files[0].name);
      setImage(e.target.files[0]);
      setNameLink(URL.createObjectURL(e.target.files[0]));
    }
  }, []);

  const getService = useCallback(
    (service_id: string) => {
      return optionsService.find((service) => service.value === service_id);
    },
    [optionsService]
  );

  const setService = useCallback((key: any, value: any) => {
    setEmployeeServices((oldArray) =>
      oldArray.map((employeeService, index) => {
        if (index === key) {
          return { ...employeeService, service_id: value.value };
        }

        return employeeService;
      })
    );
  }, []);

  const deleteService = useCallback((key: number) => {
    setEmployeeServices((oldArray) =>
      oldArray.filter((value, index) => index !== key)
    );
  }, []);

  const setPrice = useCallback((key: number, value: any) => {
    setEmployeeServices((oldArray) =>
      oldArray.map((employeeService, index) => {
        if (index === key) {
          return { ...employeeService, price: value.target.value };
        }
        return employeeService;
      })
    );
  }, []);

  const setHours = useCallback((key: number, value: any) => {
    setEmployeeServices((oldArray) =>
      oldArray.map((employeeService, index) => {
        if (index === key) {
          return {
            ...employeeService,
            duration: {
              ...employeeService.duration,
              hours: value.target.value,
            },
          };
        }
        return employeeService;
      })
    );
  }, []);

  const setMinutes = useCallback((key: number, value: any) => {
    setEmployeeServices((oldArray) =>
      oldArray.map((employeeService, index) => {
        if (index === key) {
          return {
            ...employeeService,
            duration: {
              ...employeeService.duration,
              minutes: value.target.value,
            },
          };
        }
        return employeeService;
      })
    );
  }, []);

  const setDayConfirm = useCallback((key: number, key2: number, value: any) => {
    setEmployeeServices((oldArray) =>
      oldArray.map((employeeService, index) => {
        if (index === key) {
          const ax = employeeService.days_work.map((day, index2) => {
            if (index2 === key2) {
              return { ...day, confirm: value.target.checked };
            }
            return day;
          });
          return { ...employeeService, days_work: ax };
        }
        return employeeService;
      })
    );
  }, []);

  const setOptionDuration = useCallback((time: string) => {
    return [
      {
        label: time,
        value: time,
      },
    ];
  }, []);

  const setTime = useCallback(
    (key: number, key2: number, key3: number, value: any, initial: any) => {
      setEmployeeServices((oldArray) =>
        oldArray.map((employeeService, index) => {
          if (index === key) {
            const employee = employeeService.days_work.map((day, index2) => {
              if (index2 === key2) {
                const timeWork = day.time_work.map((time, index3) => {
                  if (index3 === key3) {
                    if (initial) {
                      return { ...time, initial_time: value.value };
                    }
                    return { ...time, final_time: value.value };
                  }
                  return time;
                });
                return { ...day, time_work: timeWork };
              }
              return day;
            });
            return { ...employeeService, days_work: employee };
          }
          return employeeService;
        })
      );
    },
    []
  );

  const deleteTimeService = useCallback(
    (key: number, key2: number, key3: number) => {
      const data = employeeServices.map((employeeService, index) => {
        if (index === key) {
          const aux = employeeService.days_work.map((day, index2) => {
            if (index2 === key2 && day.time_work.length > 1) {
              const a = day.time_work.splice(key3, 1);

              return {
                ...day,
                time_work: day.time_work,
              };
            }
            return day;
          });
          return { ...employeeService, days_work: aux };
        }
        return employeeService;
      });
      setEmployeeServices(data);
    },
    [employeeServices]
  );

  const insertTimeService = useCallback(
    (serviceKey: number, timeWorkKey: number) => {
      setEmployeeServices((oldArray) =>
        oldArray.map((employeeService, index) => {
          if (index === serviceKey) {
            const aux = employeeService.days_work.map((day, index2) => {
              if (index2 === timeWorkKey) {
                const timeWork = [];
                timeWork.push(...day.time_work);
                timeWork.push({
                  initial_time: "08:00",
                  final_time: "12:00",
                });

                return {
                  ...day,
                  time_work: timeWork,
                };
              }
              return day;
            });
            return { ...employeeService, days_work: aux };
          }
          return employeeService;
        })
      );
    },
    [setEmployeeServices]
  );

  const insertService = useCallback(() => {
    const payload = serviceWorkExample;
    setEmployeeServices((oldArray) => [...oldArray, payload[0]]);
  }, [setEmployeeServices]);

  const resetFile = useCallback(() => {
    setNameLink("");
    setNameFile("");
    setImage(null);
  }, []);

  const handleDeletePhoto = useCallback(() => {
    resetFile();
  }, [resetFile]);

  useEffect(() => {
    setHoursOptions();
    getServices();
  }, [setHoursOptions, getServices]);

  return (
    <App>
      <ContainerCreate>
        <Form ref={formRef} onSubmit={handleSubmit}>
          <HeaderForm>
            <button
              type="button"
              className="cursor-pointer flex items-center py-2"
              onClick={() => navegate("/employees")}
            >
              <FaChevronLeft className="mr-1 mb-1" />
              Voltar
            </button>
            <Button type="submit" className="px-4">
              Salvar
            </Button>
          </HeaderForm>
          {loading ? (
            <div>
              <div>
                <h1 className="mb-6">Novo funcionário</h1>
                <div>
                  <div>
                    <div>
                      <label htmlFor="name" className="block text-gray-default">
                        Nome completo *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Digite o nome do funcionário"
                        className="py-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="nickname"
                        className="block text-gray-default"
                      >
                        Apelido
                      </label>
                      <Input
                        id="nickname"
                        name="nickname"
                        placeholder="Digite o apelido do funcionário"
                        className="py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="email" className="block text-gray-default">
                      E-mail *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Digite o e-mail do funcionário"
                      className="py-2"
                    />
                  </div>

                  <div>
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-gray-default"
                      >
                        Senha *
                      </label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Digite a senha"
                        className="py-2"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="passwordConfirmed"
                        className="block text-gray-default"
                      >
                        Confirmar senha *
                      </label>
                      <Input
                        id="passwordConfirmed"
                        name="passwordConfirmed"
                        placeholder="Digite sua senha novamente"
                        className="py-2"
                        type="password"
                      />
                    </div>
                  </div>

                  <div>
                    <div>
                      <label
                        htmlFor="phone_number"
                        className="block text-gray-default"
                      >
                        Número de telefone *
                      </label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        placeholder="Digite o número de telefone"
                        className="py-2"
                      />
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-gray-default">
                        Ativo *
                      </label>
                      <Select
                        value={selectedOptionActive}
                        onChange={(value) => setSelectedOptionActive(value)}
                        options={optionsActive}
                        name="active"
                        className="py-0"
                        placeholder="Selecione..."
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex">
                      <div className="mr-6">
                        <label className="block text-gray-default">
                          Foto de perfil
                        </label>
                        <Upload>
                          <label htmlFor="avatar">
                            <FaUpload className="mt-1" />
                            <span className="mt-2">Anexar arquivo</span>
                            <input
                              type="file"
                              id="avatar"
                              onChange={handlePhotoChange}
                            />
                          </label>
                        </Upload>
                      </div>
                      {nameLink && (
                        <ImgPreviewWrapper>
                          <img src={nameLink} alt="Foto de capa" />
                        </ImgPreviewWrapper>
                      )}
                    </div>
                    {nameFile && (
                      <>
                        <span className="block text-gray-defaul">
                          {nameFile}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto()}
                          className="deleteButton"
                        >
                          Deletar imagem
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <h1 className="mb-2 mt-3">Serviços do funcionário</h1>
              <Button
                type="button"
                className="px-3 py-1 mb-6"
                onClick={() => insertService()}
              >
                Adicionar serviço
              </Button>
              <Services>
                {employeeServices.map((work, key) => (
                  <ServiceItem key={`key-${key.toString()}`}>
                    <div className="mt-3">
                      <div>
                        <label
                          htmlFor="service"
                          className="block text-gray-default"
                        >
                          Serviço*
                        </label>
                        <div className="flex justify-between">
                          <Select
                            value={getService(work.service_id)}
                            onChange={(value) => setService(key, value)}
                            options={optionsService}
                            name="service"
                            className="py-0 w-full mr-5"
                            placeholder="Selecione..."
                          />
                          <ButtonDeleteService
                            title="Deletar serviço"
                            type="button"
                            onClick={() => deleteService(key)}
                          >
                            <FaTrashAlt size={15} />
                          </ButtonDeleteService>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label
                          htmlFor={`price${key.toString()}`}
                          className="block text-gray-default mb-2"
                        >
                          Valor do serviço:
                        </label>
                        <Input
                          id={`price${key.toString()}`}
                          name={`price${key.toString()}`}
                          type="string"
                          placeholder="ex: 25 reais"
                          className="py-2"
                          onChange={(value: any) => setPrice(key, value)}
                          value={work.price || ""}
                        />
                      </div>
                      <div className="mt-2 mb-1">
                        <label className="block text-gray-default mb-2">
                          Duração do serviço
                        </label>
                        <div className="flex justify-between flex-wrap">
                          <div className="flex">
                            <Label
                              htmlFor="duration_hours"
                              className="mt-2 mr-3"
                            >
                              Horas:
                            </Label>
                            <Input
                              id={`duration_hours${key.toString()}`}
                              name={`duration_hours${key.toString()}`}
                              type="number"
                              placeholder="ex: 1 hora"
                              className="py-2 mr-2 width_120"
                              min="0"
                              max="24"
                              onChange={(value: any) => setHours(key, value)}
                              value={work.duration.hours || ""}
                            />
                          </div>
                          <div className="flex">
                            <Label htmlFor="duration_minutes" className="mt-2">
                              Minutos:
                            </Label>
                            <Input
                              id={`duration_minutes${key.toString()}`}
                              name={`duration_minutes${key.toString()}`}
                              type="number"
                              placeholder="ex: 30 minutos"
                              className="py-2 ml-2 width_120"
                              min="1"
                              max="59"
                              onChange={(value: any) => setMinutes(key, value)}
                              value={work.duration.minutes || ""}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="service"
                        className="block text-gray-default"
                      >
                        Dias trabalhados nesse serviço*
                      </label>
                      <div className="flex flex-wrap">
                        {work.days_work.map((day, key2) => (
                          <ListTimes
                            key={`key-${key2.toString()}-${key.toString()}`}
                          >
                            <li>
                              <div className="flex items-center">
                                <div className="check">
                                  <Input
                                    id={`day${key}_${key2}`}
                                    name={`day${key}_${key2}`}
                                    type="checkbox"
                                    onChange={(value: any) =>
                                      setDayConfirm(key, key2, value)
                                    }
                                    defaultChecked={day.confirm}
                                  />
                                </div>
                                <label
                                  htmlFor={`day${key}_${key2}`}
                                  className="block text-gray-default ml-2 font-bold"
                                >
                                  {day.description}
                                </label>
                              </div>
                              {day.time_work.map((time, key3) => (
                                <Time
                                  key={`key-${key.toString()}-${key2.toString()}-${key3.toString()}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <Label
                                      htmlFor={`timeinit${key}_${key2}_${key3}`}
                                      className="ml-2 mr-2"
                                    >
                                      de:
                                    </Label>
                                    <Select
                                      value={setOptionDuration(
                                        time.initial_time
                                      )}
                                      options={optionsHours}
                                      name={`timeinit${key}_${key2}_${key3}`}
                                      className="py-0 select_time"
                                      placeholder="Selecione..."
                                      onChange={(value) =>
                                        setTime(key, key2, key3, value, true)
                                      }
                                    />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <Label
                                      htmlFor={`timeend${key}_${key2}_${key3}`}
                                      className="ml-2 mr-2"
                                    >
                                      até:
                                    </Label>
                                    <Select
                                      value={setOptionDuration(time.final_time)}
                                      options={optionsHours}
                                      name={`timeend${key}_${key2}_${key3}`}
                                      className="py-0 select_time"
                                      placeholder="Selecione..."
                                      onChange={(value) =>
                                        setTime(key, key2, key3, value, false)
                                      }
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <ButtonDelete
                                      title="Deletar horário"
                                      type="button"
                                      className="pl-5"
                                      onClick={() =>
                                        deleteTimeService(key, key2, key3)
                                      }
                                    >
                                      <FaTrashAlt size={20} />
                                    </ButtonDelete>
                                    <button
                                      type="button"
                                      title="Adicionar horário"
                                      className="pl-5"
                                      onClick={() =>
                                        insertTimeService(key, key2)
                                      }
                                    >
                                      <FaPlusCircle size={20} />
                                    </button>
                                  </div>
                                </Time>
                              ))}
                            </li>
                          </ListTimes>
                        ))}
                      </div>
                    </div>
                  </ServiceItem>
                ))}
              </Services>
            </div>
          ) : (
            <NotFound>
              <FaCircleNotch size={27} className="mr-2 animate-spin" />
              Buscando...
            </NotFound>
          )}
        </Form>
      </ContainerCreate>
    </App>
  );
}
